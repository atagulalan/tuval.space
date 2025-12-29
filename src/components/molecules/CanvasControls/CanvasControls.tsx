import {
  MdUndo,
  MdRedo,
  MdAdd,
  MdRemove,
  MdFullscreen,
  MdFullscreenExit,
} from 'react-icons/md';

interface CanvasControlsProps {
  isGuest: boolean;
  isFullscreen: boolean;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreenToggle: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  isGuest,
  isFullscreen,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFullscreenToggle,
}) => {
  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1">
      {/* Undo/Redo Group */}
      {!isGuest && (
        <>
          <button
            onClick={onUndo}
            disabled={historyIndex === 0}
            className="p-3 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl"
            title="Undo (Ctrl+Z)"
          >
            <MdUndo size={20} style={{ color: '#929bc9' }} />
          </button>
          <button
            onClick={onRedo}
            disabled={historyIndex === historyLength - 1}
            className="p-3 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl"
            title="Redo (Ctrl+Y)"
          >
            <MdRedo size={20} style={{ color: '#929bc9' }} />
          </button>

          {/* Divider */}
          <div className="h-px bg-white/10 my-1" />
        </>
      )}

      {/* Zoom Controls */}
      <button
        onClick={onZoomIn}
        className="p-3 hover:bg-white/20 transition-all rounded-xl"
        title="Zoom In"
      >
        <MdAdd size={20} style={{ color: '#929bc9' }} />
      </button>
      <button
        onClick={onZoomOut}
        className="p-3 hover:bg-white/20 transition-all rounded-xl"
        title="Zoom Out"
      >
        <MdRemove size={20} style={{ color: '#929bc9' }} />
      </button>

      {/* Divider */}
      <div className="h-px bg-white/10 my-1" />

      {/* Fullscreen Button */}
      <button
        onClick={onFullscreenToggle}
        className="p-3 hover:bg-white/20 transition-all rounded-xl"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <MdFullscreenExit size={20} style={{ color: '#929bc9' }} />
        ) : (
          <MdFullscreen size={20} style={{ color: '#929bc9' }} />
        )}
      </button>
    </div>
  );
};
