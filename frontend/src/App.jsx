import { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { searchItems } from './services/api';

function App() {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);

  const handleSearch = async (query, maxResults) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await searchItems(query, maxResults);

      if (data.success) {
        setResults(data.results || []);
        setStats({
          leboncoin: data.leboncoin,
          vinted: data.vinted,
        });
        setSearchInfo({
          query: data.query,
          total: data.total,
          cached: data.cached,
          timestamp: data.timestamp,
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
      setStats(null);
      setSearchInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (searchInfo && searchInfo.query) {
      handleSearch(searchInfo.query, 50);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🔍 Bot Recherche iPhone
            </h1>
            <p className="text-gray-600">
              Recherchez des iPhone sur Leboncoin et Vinted en un clic
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {/* Search info */}
        {searchInfo && !isLoading && !error && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Recherche: <span className="font-semibold">{searchInfo.query}</span>
              {searchInfo.cached && (
                <span className="ml-2 text-green-600">(résultats en cache)</span>
              )}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && <LoadingState />}

        {/* Error state */}
        {error && !isLoading && <ErrorState error={error} onRetry={handleRetry} />}

        {/* Results */}
        {!isLoading && !error && results.length > 0 && (
          <ResultsList results={results} stats={stats} />
        )}

        {/* Empty state (no search performed yet) */}
        {!isLoading && !error && results.length === 0 && !searchInfo && (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">
              Commencez votre recherche
            </p>
            <p className="text-gray-500">
              Entrez un terme de recherche et cliquez sur "Rechercher"
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Bot de recherche d'iPhone • Leboncoin & Vinted • 2025
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Les données sont issues de sites tiers. Vérifiez toujours les annonces avant achat.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
