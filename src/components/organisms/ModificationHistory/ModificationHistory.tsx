import { DenseModification, Board } from '@/types';
import { ModificationEntry } from '@/components/molecules/ModificationEntry';
import { Button } from '@/components/atoms/ui/button';
import { FiX, FiClock } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

interface ModificationHistoryProps {
  modifications: DenseModification[];
  board: Board | null;
  onClose: () => void;
}

export const ModificationHistory: React.FC<ModificationHistoryProps> = ({
  modifications,
  board,
  onClose,
}) => {
  const { user } = useAuth();

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-black/10 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FiClock className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Modification History</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <FiX className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {modifications.length === 0 ? (
          <div className="text-center py-12">
            <FiClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No modifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start placing pixels to see the history
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modifications.map((modification) => (
              <ModificationEntry
                key={modification.id}
                modification={modification}
                currentUserId={user?.uid}
                boardOwnerId={board?.ownerId}
                boardId={board?.id}
                board={board}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-white/10">
        <p className="text-xs text-muted-foreground text-center">
          Recent pixel modifications
        </p>
      </div>
    </div>
  );
};
