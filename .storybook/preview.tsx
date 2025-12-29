import type { Preview } from '@storybook/react';
import '../src/index.css';
import React from 'react';
import { MockAuthProvider } from '../src/lib/__mocks__/auth-context';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <MockAuthProvider>
          <Story />
        </MockAuthProvider>
      </div>
    ),
  ],
};

export default preview;
