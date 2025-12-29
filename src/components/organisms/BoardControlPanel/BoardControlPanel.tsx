import { FiClock, FiSettings } from 'react-icons/fi';
import { UserMenu } from '@/components/organisms/UserMenu';
import { logButtonClick } from '@/services/analytics.service';
import { User } from '@/types/models';

interface BoardControlPanelProps {
  user: User | null;
  historyOpen: boolean;
  modificationCount: number;
  onHistoryToggle: (open: boolean) => void;
  onSettingsClick?: () => void;
}

export const BoardControlPanel: React.FC<BoardControlPanelProps> = ({
  user,
  historyOpen,
  modificationCount,
  onHistoryToggle,
  onSettingsClick,
}) => {
  const handleSettingsClick = () => {
    logButtonClick('Open Board Settings', 'BoardControlPanel');
    onSettingsClick?.();
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1 items-center">
      {/* User Menu / Login */}
      {user && (
        <>
          <UserMenu variant="board" />
          {/* Divider */}
          <div className="h-px w-full bg-white/10 my-1" />
        </>
      )}

      {/* History Toggle */}
      <button
        onClick={() => {
          logButtonClick('Toggle History', 'BoardControlPanel', {
            is_open: !historyOpen,
          });
          onHistoryToggle(!historyOpen);
        }}
        className={`p-3 hover:bg-white/20 transition-all rounded-xl relative ${
          historyOpen ? 'bg-primary' : ''
        }`}
        title={`History${modificationCount > 0 ? ` (${modificationCount > 99 ? '99+' : modificationCount})` : ''}`}
      >
        <FiClock
          className="h-5 w-5"
          style={{ color: historyOpen ? 'white' : '#929bc9' }}
        />
        {modificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
            {modificationCount > 99 ? '99+' : modificationCount}
          </span>
        )}
      </button>

      {/* Settings Button */}
      {onSettingsClick && (
        <>
          <div className="h-px w-full bg-white/10 my-1" />
          <button
            onClick={handleSettingsClick}
            className="p-3 hover:bg-white/20 transition-all rounded-xl"
            title="Board Settings"
          >
            <FiSettings className="h-5 w-5" style={{ color: '#929bc9' }} />
          </button>
        </>
      )}
    </div>
  );
};
