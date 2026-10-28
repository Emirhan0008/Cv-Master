import { eq, and, desc } from "drizzle-orm";
import { db, isCloudSqlConnected } from "./index.ts";
import { users, cvs, syncLogs } from "./schema.ts";
import { localFileDb } from "./localFileDb.ts";

/**
 * Gets or creates the user record, mapping from Firebase UID.
 */
export async function getOrCreateUser(uid: string, email: string) {
  if (isCloudSqlConnected) {
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid));
      if (existing.length > 0) {
        return existing[0];
      }
      const inserted = await db.insert(users).values({ uid, email }).returning();
      return inserted[0];
    } catch (error: any) {
      console.error("[DB REPO fallback] getOrCreateUser failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.getOrCreateUser(uid, email);
    }
  } else {
    return localFileDb.getOrCreateUser(uid, email);
  }
}

/**
 * Lists all CVs belonging to the logged in user.
 */
export async function getUserCVs(uid: string) {
  if (isCloudSqlConnected) {
    try {
      const userResult = await db.select().from(users).where(eq(users.uid, uid));
      if (userResult.length === 0) return [];
      
      const list = await db.select()
        .from(cvs)
        .where(eq(cvs.userId, userResult[0].id))
        .orderBy(desc(cvs.updatedAt));
      return list;
    } catch (error: any) {
      console.error("[DB REPO fallback] getUserCVs failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.getUserCVs(uid);
    }
  } else {
    return localFileDb.getUserCVs(uid);
  }
}

/**
 * Creates or updates a CV record, syncing properties.
 */
export async function saveOrUpdateCV(uid: string, payload: {
  localId: string;
  title: string;
  data: string;
  driveFileId?: string;
  driveSyncedAt?: Date;
}) {
  if (isCloudSqlConnected) {
    try {
      const userRecord = await getOrCreateUser(uid, "test@test.com");
      
      // Check if CV already exists in DB
      const existing = await db.select()
        .from(cvs)
        .where(and(eq(cvs.userId, userRecord.id), eq(cvs.localId, payload.localId)));

      if (existing.length > 0) {
        const updated = await db.update(cvs)
          .set({
            title: payload.title,
            data: payload.data,
            driveFileId: payload.driveFileId !== undefined ? payload.driveFileId : existing[0].driveFileId,
            driveSyncedAt: payload.driveSyncedAt !== undefined ? payload.driveSyncedAt : existing[0].driveSyncedAt,
            updatedAt: new Date()
          })
          .where(eq(cvs.id, existing[0].id))
          .returning();
        return updated[0];
      } else {
        const inserted = await db.insert(cvs)
          .values({
            userId: userRecord.id,
            localId: payload.localId,
            title: payload.title,
            data: payload.data,
            driveFileId: payload.driveFileId || null,
            driveSyncedAt: payload.driveSyncedAt || null,
            updatedAt: new Date()
          })
          .returning();
        return inserted[0];
      }
    } catch (error: any) {
      console.error("[DB REPO fallback] saveOrUpdateCV failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.saveOrUpdateCV(uid, payload);
    }
  } else {
    return localFileDb.saveOrUpdateCV(uid, payload);
  }
}

/**
 * Deletes a CV record.
 */
export async function deleteUserCV(uid: string, localId: string) {
  if (isCloudSqlConnected) {
    try {
      const userResult = await db.select().from(users).where(eq(users.uid, uid));
      if (userResult.length === 0) return false;

      await db.delete(cvs)
        .where(and(eq(cvs.userId, userResult[0].id), eq(cvs.localId, localId)));
      return true;
    } catch (error: any) {
      console.error("[DB REPO fallback] deleteUserCV failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.deleteUserCV(uid, localId);
    }
  } else {
    return localFileDb.deleteUserCV(uid, localId);
  }
}

/**
 * Creates a sync action log in DB.
 */
export async function logSyncAction(uid: string, payload: {
  action: string;
  status: 'success' | 'error';
  message: string;
}) {
  if (isCloudSqlConnected) {
    try {
      const userRecord = await db.select().from(users).where(eq(users.uid, uid));
      if (userRecord.length === 0) return null;

      const log = await db.insert(syncLogs)
        .values({
          userId: userRecord[0].id,
          action: payload.action,
          status: payload.status,
          message: payload.message,
          createdAt: new Date()
        })
        .returning();
      return log[0];
    } catch (error: any) {
      console.error("[DB REPO fallback] logSyncAction failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.logSyncAction(uid, payload);
    }
  } else {
    return localFileDb.logSyncAction(uid, payload);
  }
}

/**
 * Lists the sync transaction history.
 */
export async function getSyncLogs(uid: string) {
  if (isCloudSqlConnected) {
    try {
      const userResult = await db.select().from(users).where(eq(users.uid, uid));
      if (userResult.length === 0) return [];

      return await db.select()
        .from(syncLogs)
        .where(eq(syncLogs.userId, userResult[0].id))
        .orderBy(desc(syncLogs.createdAt))
        .limit(15);
    } catch (error: any) {
      console.error("[DB REPO fallback] getSyncLogs failed on Cloud SQL, switching to local repository:", error.message);
      return localFileDb.getSyncLogs(uid);
    }
  } else {
    return localFileDb.getSyncLogs(uid);
  }
}
