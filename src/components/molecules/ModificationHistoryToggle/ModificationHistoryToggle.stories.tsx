import type { Meta, StoryObj } from '@storybook/react';
import { ModificationHistoryToggle } from './ModificationHistoryToggle';

const meta: Meta<typeof ModificationHistoryToggle> = {
  title: 'Components/ModificationHistoryToggle',
  component: ModificationHistoryToggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModificationHistoryToggle>;

export const Closed: Story = {
  args: {
    isOpen: false,
    onChange: () => {},
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    onChange: () => {},
  },
};

export const WithCount: Story = {
  args: {
    isOpen: false,
    onChange: () => {},
    modificationCount: 5,
  },
};

export const WithHighCount: Story = {
  args: {
    isOpen: false,
    onChange: () => {},
    modificationCount: 150,
  },
};

export const WithMaxCount: Story = {
  args: {
    isOpen: false,
    onChange: () => {},
    modificationCount: 200,
  },
};
