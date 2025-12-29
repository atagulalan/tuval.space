import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CreateBoardDialog } from './CreateBoardDialog';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@/components/atoms/ui/button';

const meta: Meta<typeof CreateBoardDialog> = {
  title: 'Components/CreateBoardDialog',
  component: CreateBoardDialog,
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
type Story = StoryObj<typeof CreateBoardDialog>;

export const Default: Story = {
  render: () => <CreateBoardDialog trigger={<Button>Create Board</Button>} />,
};

const ControlledComponent = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CreateBoardDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export const Controlled: Story = {
  render: () => <ControlledComponent />,
};
