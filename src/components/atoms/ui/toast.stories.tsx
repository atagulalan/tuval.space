import type { Meta, StoryObj } from '@storybook/react';
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastProvider,
  ToastViewport,
} from './toast';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Toast>
        <ToastTitle>Scheduled: Catch up</ToastTitle>
        <ToastDescription>
          Friday, February 10, 2023 at 5:57 PM
        </ToastDescription>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

export const WithAction: Story = {
  render: () => (
    <ToastProvider>
      <Toast>
        <ToastTitle>Action Required</ToastTitle>
        <ToastDescription>You need to complete this action.</ToastDescription>
        <ToastAction altText="Undo">Undo</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

export const Destructive: Story = {
  render: () => (
    <ToastProvider>
      <Toast variant="destructive">
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>
          Something went wrong. Please try again.
        </ToastDescription>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};
