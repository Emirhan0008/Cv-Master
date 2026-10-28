import * as fs from "fs";
import * as path from "path";

const FILE_PATH = path.join(process.cwd(), "local-kv-store.json");

interface LocalUser {
  id: number;
  uid: string;
  email: string;
  createdAt: string;
}

interface LocalCV {
  id: number;
  userId: number;
  localId: string;
  title: string;
  data: string;
  driveFileId: string | null;
  driveSyncedAt: string | null;
  updatedAt: string;
}

interface LocalSyncLog {
  id: number;
  userId: number;
  action: string;
  status: "success" | "error";
  message: string;
  createdAt: string;
}

interface FileSchema {
  users: LocalUser[];
  cvs: LocalCV[];
  syncLogs: LocalSyncLog[];
}

function getStore(): FileSchema {
  if (!fs.existsSync(FILE_PATH)) {
    const initial: FileSchema = { users: [], cvs: [], syncLogs: [] };
    fs.writeFileSync(FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    const initial: FileSchema = { users: [], cvs: [], syncLogs: [] };
    fs.writeFileSync(FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function writeStore(store: FileSchema) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("[LocalFileDB] Error writing store files:", e);
  }
}

export const localFileDb = {
  getOrCreateUser: (uid: string, email: string): LocalUser => {
    const store = getStore();
    let user = store.users.find((u) => u.uid === uid);
    if (!user) {
      user = {
        id: store.users.length + 1,
        uid,
        email,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      writeStore(store);
    } else if (user.email !== email && email !== "test@test.com") {
      user.email = email;
      writeStore(store);
    }
    return user;
  },

  getUserCVs: (uid: string): LocalCV[] => {
    const store = getStore();
    const user = store.users.find((u) => u.uid === uid);
    if (!user) return [];
    
    // Filter and return sorted by updatedAt desc
    return store.cvs
      .filter((c) => c.userId === user.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  saveOrUpdateCV: (
    uid: string,
    payload: {
      localId: string;
      title: string;
      data: string;
      driveFileId?: string;
      driveSyncedAt?: Date;
    }
  ): LocalCV => {
    const store = getStore();
    let user = store.users.find((u) => u.uid === uid);
    if (!user) {
      user = {
        id: store.users.length + 1,
        uid,
        email: "test@test.com",
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
    }

    let cvIdx = store.cvs.findIndex((c) => c.userId === user!.id && c.localId === payload.localId);
    let cv: LocalCV;

    if (cvIdx >= 0) {
      const existing = store.cvs[cvIdx];
      cv = {
        ...existing,
        title: payload.title,
        data: payload.data,
        driveFileId: payload.driveFileId !== undefined ? payload.driveFileId : existing.driveFileId,
        driveSyncedAt: payload.driveSyncedAt !== undefined ? payload.driveSyncedAt.toISOString() : existing.driveSyncedAt,
        updatedAt: new Date().toISOString(),
      };
      store.cvs[cvIdx] = cv;
    } else {
      cv = {
        id: store.cvs.length + 1,
        userId: user.id,
        localId: payload.localId,
        title: payload.title,
        data: payload.data,
        driveFileId: payload.driveFileId || null,
        driveSyncedAt: payload.driveSyncedAt ? payload.driveSyncedAt.toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      store.cvs.push(cv);
    }

    writeStore(store);
    return cv;
  },

  deleteUserCV: (uid: string, localId: string): boolean => {
    const store = getStore();
    const user = store.users.find((u) => u.uid === uid);
    if (!user) return false;

    const initialLen = store.cvs.length;
    store.cvs = store.cvs.filter((c) => !(c.userId === user.id && c.localId === localId));
    
    if (store.cvs.length !== initialLen) {
      writeStore(store);
      return true;
    }
    return false;
  },

  logSyncAction: (
    uid: string,
    payload: {
      action: string;
      status: "success" | "error";
      message: string;
    }
  ): LocalSyncLog | null => {
    const store = getStore();
    const user = store.users.find((u) => u.uid === uid);
    if (!user) return null;

    const log: LocalSyncLog = {
      id: store.syncLogs.length + 1,
      userId: user.id,
      action: payload.action,
      status: payload.status,
      message: payload.message,
      createdAt: new Date().toISOString(),
    };

    store.syncLogs.push(log);
    writeStore(store);
    return log;
  },

  getSyncLogs: (uid: string): LocalSyncLog[] => {
    const store = getStore();
    const user = store.users.find((u) => u.uid === uid);
    if (!user) return [];

    return store.syncLogs
      .filter((l) => l.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);
  },
};
