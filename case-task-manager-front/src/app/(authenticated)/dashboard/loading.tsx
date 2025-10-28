export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-neutral-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-neutral-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 bg-neutral-200 rounded w-40 animate-pulse"></div>
          <div className="h-10 bg-neutral-200 rounded w-40 animate-pulse"></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-1 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="h-6 w-6 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <div className="h-6 bg-neutral-200 rounded-full w-20 animate-pulse"></div>
              <div className="h-6 bg-neutral-200 rounded-full w-16 animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}