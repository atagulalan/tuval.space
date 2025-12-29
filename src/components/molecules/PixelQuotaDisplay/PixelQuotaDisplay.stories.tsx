import type { Meta, StoryObj } from '@storybook/react';
import { PixelQuotaDisplay } from './PixelQuotaDisplay';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Timestamp } from 'firebase/firestore';

const meta: Meta<typeof PixelQuotaDisplay> = {
  title: 'Components/PixelQuotaDisplay',
  component: PixelQuotaDisplay,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PixelQuotaDisplay>;

export const Default: Story = {
  args: {},
};

export const WithPendingPixels: Story = {
  args: {
    pendingPixelsCount: 5,
    pendingPixelsNeedingQuota: 5,
  },
};

export const LowQuota: Story = {
  render: () => (
    <MockAuthProvider
      mockUser={{
        uid: 'mock-uid',
        username: 'testuser',
        email: 'test@example.com',
        pixelQuota: 10,
        lastQuotaReset: Timestamp.now(),
        createdAt: Timestamp.now(),
        boards: [],
      }}
    >
      <PixelQuotaDisplay />
    </MockAuthProvider>
  ),
};

export const OverQuota: Story = {
  args: {
    pendingPixelsCount: 10,
    pendingPixelsNeedingQuota: 150,
  },
};

export const Flashing: Story = {
  args: {
    shouldFlash: true,
  },
};
