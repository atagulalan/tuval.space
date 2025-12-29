import { Card, CardContent, CardHeader } from '@/components/atoms/ui/card';

interface LoadingProps {
  /** Loading message to display */
  message?: string;
  /** Whether to show full page loading (default: true) */
  fullPage?: boolean;
  /** Size of the spinner (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Custom background color class */
  bgColor?: string;
  /** Custom text color class */
  textColor?: string;
}

interface SkeletonCardProps {
  count?: number;
}

interface LandingPageSkeletonProps {
  // No props needed, it's a complete skeleton
}

/**
 * Simple spinner loading component
 */
export const Loading = ({
  message = 'Loading...',
  fullPage = true,
  size = 'md',
  bgColor,
  textColor,
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const defaultBgColor = fullPage ? 'bg-background-dark' : '';
  const defaultTextColor = 'text-slate-300';

  const containerClasses = fullPage
    ? `min-h-screen flex items-center justify-center ${bgColor || defaultBgColor}`
    : 'flex items-center justify-center';

  const spinnerClasses = `animate-spin rounded-full border-b-2 border-primary mx-auto mb-4 ${sizeClasses[size]}`;
  const textClasses = `${textColor || defaultTextColor} ${fullPage ? '' : 'ml-3'}`;

  if (!fullPage) {
    return (
      <div className="flex items-center justify-center">
        <div className={spinnerClasses.replace('mx-auto mb-4', '')} />
        {message && <p className={textClasses}>{message}</p>}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={spinnerClasses} />
        {message && <p className={textClasses}>{message}</p>}
      </div>
    </div>
  );
};

/**
 * Skeleton loading for board cards
 */
export const SkeletonCards = ({ count = 6 }: SkeletonCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Full page skeleton loader for LandingPage
 */
export const LandingPageSkeleton = (_props: LandingPageSkeletonProps) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-white font-['Space_Grotesk',sans-serif] overflow-x-hidden">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center justify-between whitespace-nowrap px-4 py-3 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="size-8 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-5 w-24 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="hidden md:flex">
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="md:hidden">
            <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section Skeleton */}
        <div className="w-full px-4 py-12 md:py-20 max-w-[1200px]">
          <div className="flex flex-col-reverse gap-10 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-6 lg:w-1/2 justify-center">
              <div className="flex flex-col gap-4 text-left">
                <div className="h-12 md:h-16 lg:h-20 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 md:h-8 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 md:h-8 w-full bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="h-12 w-40 bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-12 w-40 bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="lg:w-1/2 w-full flex justify-center">
              <div className="w-full aspect-square max-w-[505px] rounded-2xl bg-slate-700 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Section Skeleton */}
        <div className="w-full bg-surface-dark border-y border-border-dark">
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-1 p-4 rounded-lg">
                  <div className="h-5 w-32 bg-slate-700 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-24 bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-slate-700 rounded animate-pulse mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section Skeleton */}
        <div className="w-full px-4 py-20 max-w-[1200px]">
          <div className="flex flex-col gap-10 md:gap-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex flex-col gap-4 max-w-[600px]">
                <div className="h-10 w-48 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-full bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-xl border border-border-dark bg-surface-dark p-6"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="h-6 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Section Skeleton */}
        <div className="w-full bg-surface-dark border-y border-border-dark py-20">
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-12">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-10 w-64 bg-slate-700 rounded animate-pulse"></div>
              <div className="h-6 w-96 bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-xl border border-border-dark bg-surface-dark"
                >
                  <div className="aspect-video w-full bg-slate-700 animate-pulse"></div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-6 w-32 bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-border-dark bg-background-dark pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="h-32 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
};
