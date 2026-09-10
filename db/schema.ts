import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workspaceState = sqliteTable('workspace_state', {
  ownerId: text('owner_id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});
