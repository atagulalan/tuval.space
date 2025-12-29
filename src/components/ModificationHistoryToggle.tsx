import { Button } from '@/components/ui/button';
import { FiClock } from 'react-icons/fi';

interface ModificationHistoryToggleProps {
  isOpen: boolean;
  onChange: (open: boolean) => void;
  modificationCount?: number;
}

export const ModificationHistoryToggle: React.FC<ModificationHistoryToggleProps> = ({
  isOpen,
  onChange,
  modificationCount = 0,
}) => {
  return (
    <Button
      variant={isOpen ? 'default' : 'ghost'}
      size="icon"
      onClick={() => onChange(!isOpen)}
      style={!isOpen ? { color: '#929bc9' } : undefined}
      className={isOpen ? 'relative' : 'relative hover:opacity-80'}
      title={`History${modificationCount > 0 ? ` (${modificationCount > 99 ? '99+' : modificationCount})` : ''}`}
    >
      <FiClock className="h-5 w-5" />
      {modificationCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
          {modificationCount > 99 ? '99+' : modificationCount}
        </span>
      )}
    </Button>
  );
};

