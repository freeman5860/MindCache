/**
 * useSearch Hook
 *
 * React Hook 封装搜索功能
 */
import { useState, useCallback } from 'react';
import { contentService } from '../lib/contentService';
import type { Document } from '../types';

interface SearchResult {
  document: Document | undefined;
  chunk: { content: string; score: number };
}

interface UseSearchReturn {
  results: SearchResult[];
  isSearching: boolean;
  queryTime: number | null;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setQueryTime(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { results, queryTime } = await contentService.search(query);
      setResults(results);
      setQueryTime(queryTime);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setQueryTime(null);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    queryTime,
    error,
    search,
    clear
  };
}
