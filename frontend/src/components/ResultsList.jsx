import { useState } from 'react';
import ResultCard from './ResultCard';

export default function ResultsList({ results, stats }) {
  const [filterSource, setFilterSource] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Filter results
  let filteredResults = [...results];
  if (filterSource !== 'all') {
    filteredResults = filteredResults.filter(item => item.source === filterSource);
  }

  // Sort results
  if (sortBy === 'price-asc') {
    filteredResults.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
      return priceA - priceB;
    });
  } else if (sortBy === 'price-desc') {
    filteredResults.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
      return priceB - priceA;
    });
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Stats and filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-gray-900">{filteredResults.length}</span>
              <span className="text-gray-600 ml-2">annonces trouvées</span>
            </div>
            {stats && (
              <div className="flex gap-4 text-sm">
                <span className="text-orange-600 font-medium">
                  Leboncoin: {stats.leboncoin.count}
                </span>
                <span className="text-green-600 font-medium">
                  Vinted: {stats.vinted.count}
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les sources</option>
              <option value="leboncoin">Leboncoin uniquement</option>
              <option value="vinted">Vinted uniquement</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="default">Tri par défaut</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResults.map((item, index) => (
            <ResultCard key={`${item.source}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg">
            Aucun résultat trouvé avec ces filtres
          </p>
        </div>
      )}
    </div>
  );
}
