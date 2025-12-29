import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { Toaster } from '../toaster';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    toast: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

describe('Toaster', () => {
  it('should match snapshot', () => {
    const { container } = render(<Toaster />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with toasts', () => {
    jest.doMock('@/hooks/use-toast', () => ({
      useToast: () => ({
        toasts: [
          {
            id: '1',
            title: 'Test Toast',
            description: 'Test description',
            open: true,
          },
        ],
        toast: jest.fn(),
        dismiss: jest.fn(),
      }),
    }));

    const { container } = render(<Toaster />);
    expect(container).toMatchSnapshot();
  });
});
