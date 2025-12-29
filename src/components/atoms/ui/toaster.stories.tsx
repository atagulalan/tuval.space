import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './toaster';
import { useToast } from '@/hooks/use-toast';
import { Button } from './button';

const meta: Meta<typeof Toaster> = {
  title: 'UI/Toaster',
  component: Toaster,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM',
          });
        }}
      >
        Show Toast
      </Button>
      <Button
        onClick={() => {
          toast({
            title: 'Error',
            description: 'Something went wrong.',
            variant: 'destructive',
          });
        }}
        variant="destructive"
      >
        Show Error Toast
      </Button>
      <Toaster />
    </div>
  );
};

export const Default: Story = {
  render: () => <ToastDemo />,
};
