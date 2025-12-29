import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/types';
import { getAllBoards } from '@/services/board.service';
import { useAuth } from '@/contexts/AuthContext';
import { logPageView, logError } from '@/services/analytics.service';
import { BoardList } from '@/components/organisms/BoardList';
import { UserMenu } from '@/components/organisms/UserMenu';
import { LoginButton } from '@/components/molecules/LoginButton';
import { Button } from '@/components/atoms/ui/button';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';

export const BrowseBoardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    logPageView('Browse Boards Page');
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        const allBoards = await getAllBoards(user?.uid);
        setBoards(allBoards);
        setFilteredBoards(allBoards);
      } catch (error) {
        console.error('Error fetching boards:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch boards';
        logError('Browse Boards Fetch Error', errorMessage, 'BrowseBoardPage');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBoards(boards);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = boards.filter(
        (board) =>
          board.name.toLowerCase().includes(query) ||
          board.ownerUsername.toLowerCase().includes(query)
      );
      setFilteredBoards(filtered);
    }
  }, [searchQuery, boards]);

  return (
    <div className="min-h-screen bg-background-dark text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-surface-dark"
              >
                <FiArrowLeft />
              </Button>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <img
                  src="/logo.svg"
                  alt="tuval.space logo"
                  className="size-8"
                />
                <h1 className="text-2xl font-bold leading-tight tracking-tight">
                  Browse Boards
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!authLoading && !user && <LoginButton />}
              {!authLoading && user && <UserMenu />}
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="border-b border-border-dark bg-surface-dark/50">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search boards by name or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-dark bg-surface-dark text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="text-sm text-slate-300">
              {filteredBoards.length} board
              {filteredBoards.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </section>

      {/* Boards Section */}
      <section className="max-w-[1200px] mx-auto px-4 py-12">
        <BoardList boards={filteredBoards} loading={loading} />
      </section>
    </div>
  );
};
