import type { Meta, StoryObj } from '@storybook/react';
import { CanvasControls } from './CanvasControls';

const meta: Meta<typeof CanvasControls> = {
  title: 'Components/CanvasControls',
  component: CanvasControls,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CanvasControls>;

export const Default: Story = {
  args: {
    isGuest: false,
    isFullscreen: false,
    historyIndex: 5,
    historyLength: 10,
    onUndo: () => {},
    onRedo: () => {},
    onZoomIn: () => {},
    onZoomOut: () => {},
    onFullscreenToggle: () => {},
  },
};

export const Guest: Story = {
  args: {
    isGuest: true,
    isFullscreen: false,
    historyIndex: 0,
    historyLength: 0,
    onUndo: () => {},
    onRedo: () => {},
    onZoomIn: () => {},
    onZoomOut: () => {},
    onFullscreenToggle: () => {},
  },
};

export const Fullscreen: Story = {
  args: {
    isGuest: false,
    isFullscreen: true,
    historyIndex: 0,
    historyLength: 5,
    onUndo: () => {},
    onRedo: () => {},
    onZoomIn: () => {},
    onZoomOut: () => {},
    onFullscreenToggle: () => {},
  },
};

export const NoHistory: Story = {
  args: {
    isGuest: false,
    isFullscreen: false,
    historyIndex: 0,
    historyLength: 1,
    onUndo: () => {},
    onRedo: () => {},
    onZoomIn: () => {},
    onZoomOut: () => {},
    onFullscreenToggle: () => {},
  },
};
