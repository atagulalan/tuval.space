import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/organisms/UserMenu';
import { LoginButton } from '@/components/molecules/LoginButton';
import { LandingPageSkeleton } from '@/components/organisms/Loading';
import { logPageView, logButtonClick } from '@/services/analytics.service';
import { stats } from '@/data/stats';

export const LandingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Landing Page');
  }, []);

  const handleExploreAsGuest = () => {
    logButtonClick('Explore as Guest', 'Landing Page');
    navigate('/browse');
  };

  const handleViewMyBoards = () => {
    logButtonClick('View My Boards', 'Landing Page');
    if (user?.username) {
      navigate(`/user/${user.username}`);
    }
  };

  if (authLoading) {
    return <LandingPageSkeleton />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-white font-['Space_Grotesk',sans-serif] overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center justify-between whitespace-nowrap px-4 py-3 max-w-[1200px] mx-auto w-full">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src="/logo.svg" alt="tuval.space logo" className="size-8" />
            <h2 className="text-lg font-bold leading-tight tracking-tight">
              tuval.space
            </h2>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
            {!user && <LoginButton />}
            {user && <UserMenu />}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-current p-1">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <div className="w-full px-4 py-12 md:py-20 max-w-[1200px]">
          <div className="flex flex-col-reverse gap-10 lg:flex-row lg:items-center">
            {/* Hero Content */}
            <div className="flex flex-col gap-6 lg:w-1/2 justify-center">
              <div className="flex flex-col gap-4 text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {user
                    ? 'Welcome back!'
                    : 'Create Together on Shared Canvases'}
                </h1>
                <h2 className="text-slate-300 text-base md:text-lg font-normal leading-relaxed max-w-[505px]">
                  {user
                    ? 'Continue your creative journey. Place pixels, explore shared canvases, and collaborate with the community.'
                    : 'A shared canvas where you can have fun together with others or use it as your daily creative journal. Place pixels, express yourself, and be part of a collaborative art experience.'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {user ? (
                  <button
                    onClick={handleViewMyBoards}
                    className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">
                      dashboard
                    </span>
                    <span className="truncate">View My Boards</span>
                  </button>
                ) : (
                  <>
                    <div className="flex min-w-[140px] items-center justify-center">
                      <LoginButton />
                    </div>
                    <button
                      onClick={handleExploreAsGuest}
                      className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-surface-dark border border-border-dark hover:border-primary text-white text-base font-bold transition-all"
                    >
                      <span className="truncate">Explore as Guest</span>
                    </button>
                  </>
                )}
              </div>
              {/* Trust Indicators */}
              {!user && (
                <div className="flex items-center gap-3 pt-4 opacity-80">
                  <p className="text-sm font-medium text-slate-400">
                    Join 12,000+ artists online
                  </p>
                </div>
              )}
            </div>
            {/* Hero Visual */}
            <div className="lg:w-1/2 w-full flex justify-center">
              <div className="relative w-full aspect-square max-w-[505px] rounded-2xl overflow-hidden border border-border-dark bg-surface-dark group">
                {/* Abstract Pixel Grid Representation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                {/* Floating UI Elements */}
                <div className="absolute top-6 left-6 bg-surface-dark/90 backdrop-blur px-3 py-1.5 rounded-md border border-border-dark flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-bold">Live Updates</span>
                </div>
                <div className="absolute bottom-6 right-6 bg-primary text-white px-3 py-1.5 rounded-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">
                    brush
                  </span>
                  <span className="text-xs font-bold">Place Pixel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full bg-surface-dark border-y border-border-dark">
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1 p-4 rounded-lg border border-transparent hover:border-border-dark transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    grid_on
                  </span>
                  <p className="text-slate-400 text-sm font-medium">
                    Pixels Placed
                  </p>
                </div>
                <p className="text-3xl font-bold leading-tight">
                  {stats.pixelsPlaced.value}
                </p>
                <p className="text-green-500 text-sm font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    trending_up
                  </span>{' '}
                  {stats.pixelsPlaced.trend}
                </p>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-lg border border-transparent hover:border-border-dark transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    groups
                  </span>
                  <p className="text-slate-400 text-sm font-medium">
                    Active Artists
                  </p>
                </div>
                <p className="text-3xl font-bold leading-tight">
                  {stats.activeArtists.value}
                </p>
                <p className="text-green-500 text-sm font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    person_add
                  </span>{' '}
                  {stats.activeArtists.trend}
                </p>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-lg border border-transparent hover:border-border-dark transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    palette
                  </span>
                  <p className="text-slate-400 text-sm font-medium">
                    Total Canvases
                  </p>
                </div>
                <p className="text-3xl font-bold leading-tight">
                  {stats.totalCanvases.value}
                </p>
                <p className="text-green-500 text-sm font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    add_circle
                  </span>{' '}
                  {stats.totalCanvases.trend}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full px-4 py-20 max-w-[1200px]">
          <div className="flex flex-col gap-10 md:gap-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex flex-col gap-4 max-w-[600px]">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                  How It Works
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Experience a unique blend of creativity and strategy. Canvases
                  are shared, but your pixels are precious.
                </p>
              </div>
              <a
                className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                href="#gameplay"
              >
                Learn more about gameplay{' '}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="flex flex-col gap-4 rounded-xl border border-border-dark bg-surface-dark p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">
                    sync
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold leading-tight">
                    Real-time Collaboration
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Watch the canvas evolve live as users place pixels
                    simultaneously from around the globe. No refreshing needed.
                  </p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col gap-4 rounded-xl border border-border-dark bg-surface-dark p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">
                    timer
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold leading-tight">
                    Daily Pixel Allowance
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Strategic placement matters. Your pixels regenerate over
                    time, making every placement a tactical decision.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col gap-4 rounded-xl border border-border-dark bg-surface-dark p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">
                    all_inclusive
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold leading-tight">
                    Multiple Boards
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Create and explore multiple shared canvases. Each board is a
                    unique space for collaborative art.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gameplay Section */}
        <div
          id="gameplay"
          className="w-full bg-surface-dark border-y border-border-dark py-20"
        >
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-12">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Gameplay Guide
              </h2>
              <p className="text-slate-400 max-w-[700px] text-lg">
                Master the art of collaborative pixel placement. Learn how to
                make the most of your daily quota and create stunning artworks
                together.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pixel Quota System */}
              <div className="flex flex-col gap-6 rounded-xl border border-border-dark bg-background-dark p-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">
                      inventory_2
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight">
                    Pixel Quota System
                  </h3>
                </div>
                <div className="flex flex-col gap-4 text-slate-400">
                  <p className="leading-relaxed">
                    Every user receives a daily allocation of pixels to place on
                    shared canvases. This quota system ensures fair
                    participation and adds strategic depth to your creative
                    decisions.
                  </p>
                  <ul className="flex flex-col gap-3 list-none">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>Your pixel quota refreshes daily at midnight</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>
                        Each pixel placement consumes one from your quota
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>
                        Plan your placements strategically - pixels are limited!
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Real-time Collaboration */}
              <div className="flex flex-col gap-6 rounded-xl border border-border-dark bg-background-dark p-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">
                      groups
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight">
                    Real-time Collaboration
                  </h3>
                </div>
                <div className="flex flex-col gap-4 text-slate-400">
                  <p className="leading-relaxed">
                    Work alongside other artists in real-time. See pixels appear
                    instantly as they're placed, creating a dynamic and
                    interactive creative experience.
                  </p>
                  <ul className="flex flex-col gap-3 list-none">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>
                        Watch the canvas evolve live without refreshing
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>
                        Coordinate with others to create larger artworks
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        check_circle
                      </span>
                      <span>
                        View modification history to see how art evolves
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Strategy Tips */}
              <div className="flex flex-col gap-6 rounded-xl border border-border-dark bg-background-dark p-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">
                      lightbulb
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight">
                    Strategy Tips
                  </h3>
                </div>
                <div className="flex flex-col gap-4 text-slate-400">
                  <p className="leading-relaxed">
                    Make every pixel count with these strategic approaches to
                    collaborative art creation.
                  </p>
                  <ul className="flex flex-col gap-3 list-none">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        tips_and_updates
                      </span>
                      <span>
                        Start with an outline before filling in details
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        tips_and_updates
                      </span>
                      <span>
                        Communicate with other artists for coordinated designs
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        tips_and_updates
                      </span>
                      <span>
                        Save pixels for important details and finishing touches
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Board Features */}
              <div className="flex flex-col gap-6 rounded-xl border border-border-dark bg-background-dark p-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">
                      dashboard
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight">
                    Board Features
                  </h3>
                </div>
                <div className="flex flex-col gap-4 text-slate-400">
                  <p className="leading-relaxed">
                    Explore the full range of features available on each canvas
                    to enhance your creative experience.
                  </p>
                  <ul className="flex flex-col gap-3 list-none">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        palette
                      </span>
                      <span>
                        Full color palette with precise color selection
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        history
                      </span>
                      <span>
                        View complete modification history and timeline
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                        zoom_in
                      </span>
                      <span>Zoom and pan controls for detailed work</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Getting Started CTA */}
            <div className="flex flex-col items-center gap-6 pt-8">
              <h3 className="text-2xl font-bold text-center">
                Ready to Start Creating?
              </h3>
              <p className="text-slate-400 text-center max-w-[600px]">
                Join thousands of artists and start placing your first pixels
                today. Every masterpiece begins with a single pixel.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {user ? (
                  <button
                    onClick={handleViewMyBoards}
                    className="flex min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">
                      dashboard
                    </span>
                    <span>Go to My Boards</span>
                  </button>
                ) : (
                  <>
                    <div className="flex min-w-[160px] items-center justify-center">
                      <LoginButton />
                    </div>
                    <button
                      onClick={handleExploreAsGuest}
                      className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-surface-dark border border-border-dark hover:border-primary text-white text-base font-bold transition-all"
                    >
                      <span>Explore as Guest</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery/Showcase Section */}
        <div className="w-full bg-gradient-to-b from-slate-900 to-surface-dark border-y border-border-dark py-20">
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-12">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Community Masterpieces
              </h2>
              <p className="text-slate-400 max-w-[600px]">
                Check out some of the most impressive collaborative artworks
                completed by our community this month.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.communityMasterpieces.cards.map((card, index) => (
                <div
                  key={index}
                  onClick={() => navigate(card.url)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-900">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900"></div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-3 bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">
                        {card.title}
                      </h3>
                      <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">
                        {card.pixels}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="material-symbols-outlined text-base text-primary">
                        group
                      </span>
                      <span>{card.contributors}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  logButtonClick('View Gallery', 'Landing Page');
                  navigate('/browse');
                }}
                className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 text-primary text-sm font-bold transition-all"
              >
                View Gallery
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="w-full px-4 py-24 max-w-[800px] text-center">
            <div className="flex flex-col items-center gap-8">
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Ready to leave your mark?
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed max-w-[600px]">
                The canvas is waiting. Login now to claim your first set of
                pixels and start creating with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="flex w-full sm:w-auto min-w-[160px] items-center justify-center">
                  <LoginButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-dark bg-background-dark pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-[300px]">
              <div className="flex items-center gap-2 text-white">
                <img
                  src="/logo.svg"
                  alt="tuval.space logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold">tuval.space</span>
              </div>
              <p className="text-slate-400 text-sm">
                A collaborative canvas where you can have fun with others or use
                as your personal creative space. Create together, one pixel at a
                time.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-16">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white">Platform</h4>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#canvas"
                >
                  Canvas
                </a>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#leaderboard"
                >
                  Leaderboard
                </a>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#factions"
                >
                  Factions
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white">Community</h4>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#discord"
                >
                  Discord
                </a>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#reddit"
                >
                  Reddit
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white">Legal</h4>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#terms"
                >
                  Terms
                </a>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#privacy"
                >
                  Privacy
                </a>
                <a
                  className="text-slate-400 hover:text-primary text-sm"
                  href="#guidelines"
                >
                  Guidelines
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border-dark flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© 2026 tuval.space. All rights reserved.</p>
            <div className="flex gap-4">
              <a
                className="hover:text-primary transition-colors"
                href="https://github.com/atagulalan/tuval.space"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
