/**
 * Embedding Web Worker
 *
 * 在独立线程中运行 Transformers.js，避免阻塞主线程 UI
 * 使用 gte-small 模型：30MB，384 维向量，中英文效果好
 */
import { pipeline, env, type FeatureExtractionPipeline } from '@xenova/transformers';

// 配置 Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true; // 启用浏览器缓存

// 模型单例
let embeddingPipeline: FeatureExtractionPipeline | null = null;
const MODEL_NAME = 'Xenova/gte-small'; // 384 dimensions, ~30MB

/**
 * 初始化 embedding pipeline
 */
async function initPipeline(): Promise<void> {
  if (embeddingPipeline) return;

  self.postMessage({
    type: 'PROGRESS',
    payload: { status: 'loading', progress: 0, file: MODEL_NAME }
  });

  embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
    progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
      self.postMessage({
        type: 'PROGRESS',
        payload: {
          status: progress.status,
          progress: progress.progress ?? 0,
          file: progress.file
        }
      });
    }
  });

  self.postMessage({ type: 'MODEL_LOADED' });
}

/**
 * 生成文本向量
 */
async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!embeddingPipeline) {
    throw new Error('Pipeline not initialized');
  }

  const results: number[][] = [];

  for (const text of texts) {
    // 截断过长文本（模型最大 512 tokens）
    const truncated = text.slice(0, 2000);

    const output = await embeddingPipeline(truncated, {
      pooling: 'mean',
      normalize: true
    });

    // 转换为普通数组
    results.push(Array.from(output.data as Float32Array));
  }

  return results;
}

// 消息处理
self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initPipeline();
        break;

      case 'EMBED_TEXT':
      case 'EMBED_BATCH': {
        await initPipeline(); // 确保已初始化
        const embeddings = await embedTexts(payload.texts);
        self.postMessage({
          type: 'EMBEDDING_RESULT',
          id,
          payload: { embeddings }
        });
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id,
      payload: { error: (error as Error).message }
    });
  }
};
