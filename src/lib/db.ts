/**
 * Dexie Database
 *
 * 用于存储原始文档内容（与 Orama 向量库分离）
 */
import Dexie, { type Table } from 'dexie';
import type { Document } from '../types';

class MindCacheDB extends Dexie {
  documents!: Table<Document, string>;
  metadata!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('MindCacheDB');

    this.version(1).stores({
      documents: 'id, url, title, savedAt, updatedAt',
      metadata: 'key'
    });
  }
}

export const db = new MindCacheDB();

// Document CRUD operations
export const documentStore = {
  async add(doc: Omit<Document, 'id' | 'savedAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();

    await db.documents.add({
      ...doc,
      id,
      savedAt: now,
      updatedAt: now
    });

    return id;
  },

  async get(id: string): Promise<Document | undefined> {
    return db.documents.get(id);
  },

  async getAll(): Promise<Document[]> {
    return db.documents.orderBy('savedAt').reverse().toArray();
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    await db.documents.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
  },

  async delete(id: string): Promise<void> {
    await db.documents.delete(id);
  },

  async count(): Promise<number> {
    return db.documents.count();
  }
};
