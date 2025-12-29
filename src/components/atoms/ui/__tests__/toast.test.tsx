import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from '../toast';

describe('Toast', () => {
  it('should match snapshot', () => {
    const { container } = render(
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
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with destructive variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="destructive">
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Something went wrong</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
