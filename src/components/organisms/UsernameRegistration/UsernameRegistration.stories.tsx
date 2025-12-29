import type { Meta, StoryObj } from '@storybook/react';
import { UsernameRegistration } from './UsernameRegistration';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

const meta: Meta<typeof UsernameRegistration> = {
  title: 'Components/UsernameRegistration',
  component: UsernameRegistration,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider mockUser={null} mockNeedsUsername={true}>
        <Story />
        <Toaster />
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UsernameRegistration>;

export const Default: Story = {
  render: () => <UsernameRegistration />,
};

export const Loading: Story = {
  render: () => (
    <MockAuthProvider
      mockUser={null}
      mockNeedsUsername={true}
      mockLoading={true}
    >
      <UsernameRegistration />
      <Toaster />
    </MockAuthProvider>
  ),
};
