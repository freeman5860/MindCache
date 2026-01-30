/**
 * Embedding Service
 *
 * 封装 Web Worker 通信，提供 Promise-based API
 */
import type { EmbedResponse, ProgressMessage } from '../types';

type ProgressCallback = (progress: ProgressMessage['payload']) => void;

class EmbeddingService {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: number[][]) => void;
    reject: (error: Error) => void;
  }>();
  private isReady = false;
  private readyPromise: Promise<void> | null = null;
  private onProgress: ProgressCallback | null = null;

  /**
   * 初始化 Worker
   */
  async init(onProgress?: ProgressCallback): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.onProgress = onProgress ?? null;

    this.readyPromise = new Promise((resolve, reject) => {
      // Vite 的 Web Worker 导入方式
      this.worker = new Worker(
        new URL('../workers/embedding.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event) => {
        const { type, id, payload } = event.data;

        switch (type) {
          case 'MODEL_LOADED':
            this.isReady = true;
            resolve();
            break;

          case 'PROGRESS':
            this.onProgress?.(payload);
            break;

          case 'EMBEDDING_RESULT': {
            const request = this.pendingRequests.get(id);
            if (request) {
              request.resolve((payload as EmbedResponse['payload']).embeddings);
              this.pendingRequests.delete(id);
            }
            break;
          }

          case 'ERROR': {
            const errorRequest = this.pendingRequests.get(id);
            if (errorRequest) {
              errorRequest.reject(new Error((payload as { error: string }).error));
              this.pendingRequests.delete(id);
            }
            break;
          }
        }
      };

      this.worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      // 发送初始化消息
      this.worker.postMessage({ type: 'INIT' });
    });

    return this.readyPromise;
  }

  /**
   * 生成单个文本的向量
   */
  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  /**
   * 批量生成向量
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.worker) {
      throw new Error('EmbeddingService not initialized. Call init() first.');
    }

    await this.readyPromise;

    const id = `req_${++this.requestId}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        type: 'EMBED_BATCH',
        id,
        payload: { texts }
      });
    });
  }

  /**
   * 检查服务是否就绪
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * 销毁 Worker
   */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
    this.readyPromise = null;
    this.pendingRequests.clear();
  }
}

// 导出单例
export const embeddingService = new EmbeddingService();
