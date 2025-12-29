import type { Meta, StoryObj } from '@storybook/react';
import { UserMenu } from './UserMenu';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';
import { MemoryRouter } from 'react-router-dom';

const meta: Meta<typeof UserMenu> = {
  title: 'Components/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider>
          <Story />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  args: {},
};

export const BoardVariant: Story = {
  args: {
    variant: 'board',
  },
};

export const HideCreateBoard: Story = {
  args: {
    hideCreateBoard: true,
  },
};
