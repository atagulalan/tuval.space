import type { Meta, StoryObj } from '@storybook/react';
import { LoginButton } from './LoginButton';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

const meta: Meta<typeof LoginButton> = {
  title: 'Components/LoginButton',
  component: LoginButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider mockUser={null}>
        <Story />
        <Toaster />
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginButton>;

export const Default: Story = {
  render: () => <LoginButton />,
};

export const SigningIn: Story = {
  render: () => (
    <MockAuthProvider mockUser={null} mockIsSigningIn={true}>
      <LoginButton />
      <Toaster />
    </MockAuthProvider>
  ),
};
