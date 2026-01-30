interface LoadingScreenProps {
  progress: {
    status: string;
    progress: number;
    file?: string;
  } | null;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  const percentage = progress?.progress ?? 0;
  const status = progress?.status ?? 'Initializing...';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="w-16 h-16 mx-auto">
          <svg
            className="animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Loading AI Model
          </h2>
          <p className="text-gray-600 mt-1">
            {status === 'progress' ? 'Downloading model...' : status}
          </p>
          {progress?.file && (
            <p className="text-sm text-gray-500 mt-1 truncate max-w-xs mx-auto">
              {progress.file}
            </p>
          )}
        </div>

        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {percentage.toFixed(0)}%
          </p>
        </div>

        <p className="text-sm text-gray-400 max-w-sm">
          First load may take a minute. The model will be cached for instant loading next time.
        </p>
      </div>
    </div>
  );
}
