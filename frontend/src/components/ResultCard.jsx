export default function ResultCard({ item }) {
  const getSourceBadge = (source) => {
    const badges = {
      leboncoin: {
        text: 'Leboncoin',
        className: 'bg-orange-100 text-orange-800',
      },
      vinted: {
        text: 'Vinted',
        className: 'bg-green-100 text-green-800',
      },
    };

    const badge = badges[source] || { text: source, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card overflow-hidden block transition-transform duration-200 hover:scale-[1.02]"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-3 right-3">
          {getSourceBadge(item.source)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {item.title}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary-600">
            {item.price}
          </span>
        </div>

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{item.location}</span>
          </div>

          {item.date && (
            <span className="text-gray-500 text-xs ml-2">{item.date}</span>
          )}
        </div>

        {/* Additional info for Vinted */}
        {item.source === 'vinted' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              {item.seller && (
                <span className="truncate">Vendeur: {item.seller}</span>
              )}
              {item.condition && (
                <span className="capitalize">{item.condition}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}
