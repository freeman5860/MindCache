/**
 * Vector Store
 *
 * 使用 Orama 进行向量存储和语义搜索
 * 支持持久化到 IndexedDB
 */
import { create, insert, remove, search } from '@orama/orama';
import { persist, restore } from '@orama/plugin-data-persistence';
import { db } from './db';
import type { OramaDocument, SearchResult } from '../types';

// Orama schema 定义
const schema = {
  id: 'string',
  documentId: 'string',
  content: 'string',
  title: 'string',
  url: 'string',
  embedding: 'vector[384]', // gte-small 输出 384 维向量
  savedAt: 'number'
} as const;

type OramaDB = Awaited<ReturnType<typeof create<typeof schema>>>;

class VectorStore {
  private orama: OramaDB | null = null;
  private readonly STORAGE_KEY = 'orama_vector_db';

  /**
   * 初始化向量数据库
   */
  async init(): Promise<void> {
    // 尝试从 IndexedDB 恢复
    const persisted = await this.loadFromStorage();

    if (persisted) {
      this.orama = await restore('json', persisted) as OramaDB;
      console.log('Vector store restored from IndexedDB');
    } else {
      this.orama = await create({ schema });
      console.log('Vector store created fresh');
    }
  }

  /**
   * 添加文档块到向量库
   */
  async add(doc: OramaDocument): Promise<void> {
    if (!this.orama) throw new Error('VectorStore not initialized');

    await insert(this.orama, doc);
    await this.saveToStorage();
  }

  /**
   * 批量添加
   */
  async addBatch(docs: OramaDocument[]): Promise<void> {
    if (!this.orama) throw new Error('VectorStore not initialized');

    for (const doc of docs) {
      await insert(this.orama, doc);
    }
    await this.saveToStorage();
  }

  /**
   * 向量相似度搜索
   */
  async search(queryEmbedding: number[], limit = 10): Promise<SearchResult[]> {
    if (!this.orama) throw new Error('VectorStore not initialized');

    const results = await search(this.orama, {
      mode: 'vector',
      vector: {
        value: queryEmbedding,
        property: 'embedding'
      },
      limit,
      similarity: 0.5 // 最低相似度阈值
    });

    return results.hits.map((hit) => ({
      id: hit.document.id,
      documentId: hit.document.documentId,
      title: hit.document.title,
      url: hit.document.url,
      content: hit.document.content,
      score: hit.score,
      savedAt: hit.document.savedAt
    }));
  }

  /**
   * 混合搜索（向量 + 全文）
   */
  async hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    limit = 10
  ): Promise<SearchResult[]> {
    if (!this.orama) throw new Error('VectorStore not initialized');

    const results = await search(this.orama, {
      mode: 'hybrid',
      term: queryText,
      vector: {
        value: queryEmbedding,
        property: 'embedding'
      },
      limit,
      similarity: 0.3
    });

    return results.hits.map((hit) => ({
      id: hit.document.id,
      documentId: hit.document.documentId,
      title: hit.document.title,
      url: hit.document.url,
      content: hit.document.content,
      score: hit.score,
      savedAt: hit.document.savedAt
    }));
  }

  /**
   * 删除文档的所有块
   */
  async removeByDocumentId(documentId: string): Promise<void> {
    if (!this.orama) throw new Error('VectorStore not initialized');

    // 先搜索所有相关块
    const results = await search(this.orama, {
      term: documentId,
      properties: ['documentId'],
      limit: 1000
    });

    // 逐个删除
    for (const hit of results.hits) {
      await remove(this.orama, hit.id);
    }

    await this.saveToStorage();
  }

  /**
   * 持久化到 IndexedDB
   */
  private async saveToStorage(): Promise<void> {
    if (!this.orama) return;

    const serialized = await persist(this.orama, 'json');
    await db.metadata.put({ key: this.STORAGE_KEY, value: serialized });
  }

  /**
   * 从 IndexedDB 加载
   */
  private async loadFromStorage(): Promise<string | null> {
    const record = await db.metadata.get(this.STORAGE_KEY);
    return record?.value as string | null;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ count: number }> {
    if (!this.orama) return { count: 0 };

    // 简单搜索获取总数
    const results = await search(this.orama, {
      term: '',
      limit: 0
    });

    return { count: results.count };
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.orama = await create({ schema });
    await this.saveToStorage();
  }
}

export const vectorStore = new VectorStore();
