import type { Meta, StoryObj } from '@storybook/react';
import { Loading, SkeletonCards, LandingPageSkeleton } from './Loading';

const meta: Meta<typeof Loading> = {
  title: 'Components/Loading',
  component: Loading,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {
  args: {
    message: 'Loading...',
    fullPage: true,
  },
};

export const Inline: Story = {
  args: {
    message: 'Loading content...',
    fullPage: false,
  },
};

export const Small: Story = {
  args: {
    message: 'Loading...',
    fullPage: false,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    message: 'Loading...',
    fullPage: false,
    size: 'lg',
  },
};

export const SkeletonCardsStory: Story = {
  render: () => <SkeletonCards count={6} />,
};

export const LandingPageSkeletonStory: Story = {
  render: () => <LandingPageSkeleton />,
};
