/**
 * Content Service
 *
 * 协调内容保存的完整流程：
 * 解析 → 分块 → 向量化 → 存储
 */
import { documentStore } from './db';
import { vectorStore } from './vectorStore';
import { embeddingService } from './embedding';
import { chunkText, generateExcerpt } from './chunker';
import type { Document, OramaDocument } from '../types';

interface SaveContentOptions {
  url: string;
  title: string;
  content: string;
}

interface SaveResult {
  documentId: string;
  chunksCount: number;
}

class ContentService {
  private initialized = false;

  /**
   * 初始化所有服务
   */
  async init(onProgress?: (progress: { status: string; progress: number }) => void): Promise<void> {
    if (this.initialized) return;

    // 并行初始化向量库和 embedding 服务
    await Promise.all([
      vectorStore.init(),
      embeddingService.init(onProgress)
    ]);

    this.initialized = true;
  }

  /**
   * 保存内容
   */
  async saveContent(options: SaveContentOptions): Promise<SaveResult> {
    const { url, title, content } = options;

    // 1. 保存原始文档
    const documentId = await documentStore.add({
      url,
      title,
      content,
      excerpt: generateExcerpt(content)
    });

    // 2. 分块
    const chunks = chunkText(content);

    // 3. 批量向量化
    const embeddings = await embeddingService.embedBatch(chunks);

    // 4. 存入向量库
    const oramaDocs: OramaDocument[] = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      documentId,
      content: chunk,
      title,
      url,
      embedding: embeddings[index],
      savedAt: Date.now()
    }));

    await vectorStore.addBatch(oramaDocs);

    return {
      documentId,
      chunksCount: chunks.length
    };
  }

  /**
   * 语义搜索
   */
  async search(query: string, limit = 10): Promise<{
    results: Array<{
      document: Document | undefined;
      chunk: { content: string; score: number };
    }>;
    queryTime: number;
  }> {
    const startTime = performance.now();

    // 1. 生成查询向量
    const queryEmbedding = await embeddingService.embed(query);

    // 2. 向量搜索
    const searchResults = await vectorStore.hybridSearch(queryEmbedding, query, limit);

    // 3. 获取完整文档信息
    const results = await Promise.all(
      searchResults.map(async (result) => ({
        document: await documentStore.get(result.documentId),
        chunk: {
          content: result.content,
          score: result.score
        }
      }))
    );

    // 4. 去重（同一文档可能有多个块命中）
    const seen = new Set<string>();
    const uniqueResults = results.filter((r) => {
      if (!r.document || seen.has(r.document.id)) return false;
      seen.add(r.document.id);
      return true;
    });

    return {
      results: uniqueResults,
      queryTime: performance.now() - startTime
    };
  }

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string): Promise<void> {
    await Promise.all([
      documentStore.delete(documentId),
      vectorStore.removeByDocumentId(documentId)
    ]);
  }

  /**
   * 获取所有文档
   */
  async getAllDocuments(): Promise<Document[]> {
    return documentStore.getAll();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    documentCount: number;
    chunkCount: number;
  }> {
    const [documentCount, vectorStats] = await Promise.all([
      documentStore.count(),
      vectorStore.getStats()
    ]);

    return {
      documentCount,
      chunkCount: vectorStats.count
    };
  }

  /**
   * 检查是否就绪
   */
  get isReady(): boolean {
    return this.initialized && embeddingService.ready;
  }
}

export const contentService = new ContentService();
