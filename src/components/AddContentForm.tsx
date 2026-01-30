import { useState } from 'react';

interface AddContentFormProps {
  onSave: (url: string, title: string, content: string) => Promise<string>;
  disabled?: boolean;
}

export function AddContentForm({ onSave, disabled }: AddContentFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      await onSave(url || 'local://note', title || 'Untitled', content);
      // 清空表单
      setUrl('');
      setTitle('');
      setContent('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold">Add Content</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL (optional)
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste article content here..."
          rows={6}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || isSaving}
          required
        />
      </div>

      <button
        type="submit"
        disabled={disabled || isSaving || !content.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving & Vectorizing...' : 'Save to Memory'}
      </button>
    </form>
  );
}
