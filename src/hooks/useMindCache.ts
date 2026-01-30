/**
 * useMindCache Hook
 *
 * 主要 Hook，管理应用初始化和全局状态
 */
import { useState, useEffect, useCallback } from 'react';
import { contentService } from '../lib/contentService';
import type { Document } from '../types';

interface InitProgress {
  status: string;
  progress: number;
  file?: string;
}

interface UseMindCacheReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  initProgress: InitProgress | null;
  initError: string | null;
  documents: Document[];
  stats: { documentCount: number; chunkCount: number } | null;
  saveContent: (url: string, title: string, content: string) => Promise<string>;
  deleteDocument: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export function useMindCache(): UseMindCacheReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState<InitProgress | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<{ documentCount: number; chunkCount: number } | null>(null);

  // 初始化
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);

      try {
        await contentService.init((progress) => {
          if (mounted) {
            setInitProgress(progress);
          }
        });

        if (mounted) {
          setIsInitialized(true);
          // 加载文档列表
          const docs = await contentService.getAllDocuments();
          setDocuments(docs);
          const s = await contentService.getStats();
          setStats(s);
        }
      } catch (err) {
        if (mounted) {
          setInitError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [isInitialized, isInitializing]);

  // 保存内容
  const saveContent = useCallback(async (url: string, title: string, content: string) => {
    const result = await contentService.saveContent({ url, title, content });
    // 刷新列表
    const docs = await contentService.getAllDocuments();
    setDocuments(docs);
    const s = await contentService.getStats();
    setStats(s);
    return result.documentId;
  }, []);

  // 删除文档
  const deleteDocument = useCallback(async (id: string) => {
    await contentService.deleteDocument(id);
    const docs = await contentService.getAllDocuments();
    setDocuments(docs);
    const s = await contentService.getStats();
    setStats(s);
  }, []);

  // 刷新文档列表
  const refreshDocuments = useCallback(async () => {
    const docs = await contentService.getAllDocuments();
    setDocuments(docs);
    const s = await contentService.getStats();
    setStats(s);
  }, []);

  return {
    isInitialized,
    isInitializing,
    initProgress,
    initError,
    documents,
    stats,
    saveContent,
    deleteDocument,
    refreshDocuments
  };
}
