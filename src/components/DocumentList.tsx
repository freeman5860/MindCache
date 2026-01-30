import type { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => Promise<void>;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No documents saved yet.</p>
        <p className="text-sm">Add some content to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Saved Documents ({documents.length})</h2>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{doc.title}</h3>
              <p className="text-sm text-gray-500 truncate">{doc.excerpt}</p>
              <p className="text-xs text-gray-400">
                {new Date(doc.savedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="ml-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
