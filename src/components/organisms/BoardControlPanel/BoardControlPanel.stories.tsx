import type { Meta, StoryObj } from '@storybook/react';
import { BoardControlPanel } from './BoardControlPanel';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from '@/components/atoms/ui/toaster';
import { User } from '@/types/models';
import { Timestamp } from 'firebase/firestore';

const meta: Meta<typeof BoardControlPanel> = {
  title: 'Components/BoardControlPanel',
  component: BoardControlPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <Story />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BoardControlPanel>;

const mockUser: User = {
  uid: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  pixelQuota: 100,
  lastQuotaReset: Timestamp.now(),
  createdAt: Timestamp.now(),
  boards: [],
};

export const Default: Story = {
  args: {
    user: mockUser,
    historyOpen: false,
    modificationCount: 0,
    onHistoryToggle: () => {},
  },
};

export const HistoryOpen: Story = {
  args: {
    user: mockUser,
    historyOpen: true,
    modificationCount: 5,
    onHistoryToggle: () => {},
  },
};

export const WithModifications: Story = {
  args: {
    user: mockUser,
    historyOpen: false,
    modificationCount: 15,
    onHistoryToggle: () => {},
  },
};

export const WithSettings: Story = {
  args: {
    user: mockUser,
    historyOpen: false,
    modificationCount: 0,
    onHistoryToggle: () => {},
    onSettingsClick: () => {},
  },
};

export const NoUser: Story = {
  args: {
    user: null,
    historyOpen: false,
    modificationCount: 0,
    onHistoryToggle: () => {},
  },
};
