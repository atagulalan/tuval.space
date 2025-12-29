import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('should match snapshot when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(container).toMatchSnapshot();

    consoleSpy.mockRestore();
  });

  it('should match snapshot with custom fallback', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(container).toMatchSnapshot();

    consoleSpy.mockRestore();
  });
});
