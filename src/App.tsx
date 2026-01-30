import { useMindCache } from './hooks/useMindCache';
import { SearchBox } from './components/SearchBox';
import { AddContentForm } from './components/AddContentForm';
import { DocumentList } from './components/DocumentList';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const {
    isInitialized,
    isInitializing,
    initProgress,
    initError,
    documents,
    stats,
    saveContent,
    deleteDocument
  } = useMindCache();

  // 显示加载界面
  if (isInitializing || !isInitialized) {
    return <LoadingScreen progress={initProgress} />;
  }

  // 显示错误
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-red-600">
            Failed to initialize
          </h2>
          <p className="text-gray-600 mt-2">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MindCache</h1>
              <p className="text-sm text-gray-500">
                Your local-first second brain
              </p>
            </div>
            {stats && (
              <div className="text-right text-sm text-gray-500">
                <p>{stats.documentCount} documents</p>
                <p>{stats.chunkCount} vectors</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Semantic Search</h2>
          <SearchBox />
        </section>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Content */}
          <section>
            <AddContentForm onSave={saveContent} disabled={!isInitialized} />
          </section>

          {/* Document List */}
          <section className="bg-white rounded-lg shadow p-4">
            <DocumentList documents={documents} onDelete={deleteDocument} />
          </section>
        </div>

        {/* Privacy Notice */}
        <footer className="text-center text-sm text-gray-400 py-4">
          <p>
            All data stays in your browser. Nothing is sent to any server.
          </p>
          <p className="mt-1">
            Powered by Transformers.js + Orama
          </p>
        </footer>
      </main>
    </div>
  );
}
