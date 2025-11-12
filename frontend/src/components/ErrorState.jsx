export default function ErrorState({ error, onRetry }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card p-8 text-center">
        {/* Error icon */}
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Oops, une erreur est survenue
        </h2>
        <p className="text-gray-600 mb-6">
          {error || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
        </p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Réessayer
          </button>
        )}

        {/* Help text */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Si le problème persiste, les sites peuvent être temporairement indisponibles.</p>
        </div>
      </div>
    </div>
  );
}
