import { useState, useCallback } from 'react';
import { useSearch } from '../hooks/useSearch';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const { results, isSearching, queryTime, error, search, clear } = useSearch();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      search(query);
    },
    [query, search]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    clear();
  }, [clear]);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your memory... (e.g., 'articles about React hooks')"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {queryTime !== null && (
        <p className="text-sm text-gray-500">
          Found {results.length} results in {queryTime.toFixed(0)}ms
        </p>
      )}

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-blue-600 hover:underline">
                  {result.document?.title || 'Untitled'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {result.document?.url}
                </p>
              </div>
              <span className="text-xs text-gray-400 ml-2">
                Score: {(result.chunk.score * 100).toFixed(1)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-700 line-clamp-3">
              {result.chunk.content}
            </p>
            {result.document && (
              <p className="mt-1 text-xs text-gray-400">
                Saved: {new Date(result.document.savedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
