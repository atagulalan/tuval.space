import { useNavigate } from 'react-router-dom';
import { Board } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SkeletonCards } from '@/components/Loading';
import { formatTimestamp } from '@/lib/utils';
import { FiLock } from 'react-icons/fi';

interface BoardListProps {
  boards: Board[];
  loading?: boolean;
}

export const BoardList: React.FC<BoardListProps> = ({ boards, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return <SkeletonCards count={6} />;
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No boards found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <Card
          key={board.id}
          className="cursor-pointer transition-all"
          onClick={() => navigate(`/board/${board.name}`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{board.name}</span>
              <div className="flex items-center gap-2">
                {!board.isPublic && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded flex items-center gap-1">
                    <FiLock className="h-3 w-3" />
                    Private
                  </span>
                )}
                {board.isSpecialEvent && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Event
                  </span>
                )}
              </div>
            </CardTitle>
            <CardDescription>by {board.ownerUsername}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Dimensions: {board.width} × {board.height} ({board.maxPixels.toLocaleString()}{' '}
                pixels)
              </p>
              <p>Created {formatTimestamp(board.createdAt.toDate())}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};




