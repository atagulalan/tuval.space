import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { CanvasControls } from './CanvasControls';

describe('CanvasControls', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <CanvasControls
        isGuest={false}
        isFullscreen={false}
        historyIndex={5}
        historyLength={10}
        onUndo={() => {}}
        onRedo={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFullscreenToggle={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for guest', () => {
    const { container } = render(
      <CanvasControls
        isGuest={true}
        isFullscreen={false}
        historyIndex={0}
        historyLength={0}
        onUndo={() => {}}
        onRedo={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFullscreenToggle={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot in fullscreen', () => {
    const { container } = render(
      <CanvasControls
        isGuest={false}
        isFullscreen={true}
        historyIndex={0}
        historyLength={5}
        onUndo={() => {}}
        onRedo={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFullscreenToggle={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
