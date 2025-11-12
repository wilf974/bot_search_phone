export default function LoadingState() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Stats skeleton */}
      <div className="card p-4 mb-6">
        <div className="skeleton h-12 w-full rounded"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="card overflow-hidden">
            {/* Image skeleton */}
            <div className="skeleton h-48 w-full"></div>

            {/* Content skeleton */}
            <div className="p-4">
              <div className="skeleton h-6 w-3/4 mb-2 rounded"></div>
              <div className="skeleton h-6 w-1/2 mb-3 rounded"></div>
              <div className="skeleton h-4 w-full mb-2 rounded"></div>
              <div className="skeleton h-4 w-2/3 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
