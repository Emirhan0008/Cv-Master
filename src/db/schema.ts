import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cvs = pgTable('cvs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  localId: text('local_id').notNull(),
  title: text('title').notNull(),
  data: text('data').notNull(), // JSON block of CVData
  driveFileId: text('drive_file_id'), // Google Drive file ID if synced
  driveSyncedAt: timestamp('drive_synced_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  action: text('action').notNull(), // 'database_save', 'drive_sync', 'drive_import', etc.
  status: text('status').notNull(), // 'success' | 'error'
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  cvs: many(cvs),
  syncLogs: many(syncLogs),
}));

export const cvsRelations = relations(cvs, ({ one }) => ({
  author: one(users, {
    fields: [cvs.userId],
    references: [users.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id],
  }),
}));
