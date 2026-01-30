/**
 * Text Chunker
 *
 * 将长文本分割成适合 embedding 的块
 * 使用滑动窗口策略保持上下文连贯性
 */

interface ChunkOptions {
  maxLength?: number;    // 每块最大字符数
  overlap?: number;      // 块之间重叠字符数
  separator?: RegExp;    // 优先分割点（句子/段落）
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxLength: 1000,       // ~200-250 tokens for English
  overlap: 100,          // 保持上下文连贯
  separator: /[。！？.!?\n]+/g
};

/**
 * 智能文本分块
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const { maxLength, overlap, separator } = { ...DEFAULT_OPTIONS, ...options };

  // 清理文本
  const cleanedText = text
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedText.length <= maxLength) {
    return [cleanedText];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = start + maxLength;

    // 如果不是最后一块，尝试在句子边界分割
    if (end < cleanedText.length) {
      const segment = cleanedText.slice(start, end);
      const matches = [...segment.matchAll(separator)];

      if (matches.length > 0) {
        // 找最后一个分隔符位置
        const lastMatch = matches[matches.length - 1];
        end = start + (lastMatch.index ?? 0) + lastMatch[0].length;
      }
    }

    const chunk = cleanedText.slice(start, Math.min(end, cleanedText.length)).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // 移动窗口，考虑重叠
    start = end - overlap;

    // 防止无限循环
    if (start >= cleanedText.length - overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * 生成文本摘要（取前 N 个字符）
 */
export function generateExcerpt(text: string, maxLength = 200): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // 尝试在句子边界截断
  const truncated = cleaned.slice(0, maxLength);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('?')
  );

  if (lastPeriod > maxLength * 0.5) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + '...';
}
