import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { Loading, SkeletonCards, LandingPageSkeleton } from './Loading';

describe('Loading', () => {
  it('should match snapshot', () => {
    const { container } = render(<Loading />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with message', () => {
    const { container } = render(<Loading message="Loading data..." />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot inline', () => {
    const { container } = render(<Loading fullPage={false} />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with size', () => {
    const { container } = render(<Loading size="lg" />);
    expect(container).toMatchSnapshot();
  });
});

describe('SkeletonCards', () => {
  it('should match snapshot', () => {
    const { container } = render(<SkeletonCards />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with count', () => {
    const { container } = render(<SkeletonCards count={3} />);
    expect(container).toMatchSnapshot();
  });
});

describe('LandingPageSkeleton', () => {
  it('should match snapshot', () => {
    const { container } = render(<LandingPageSkeleton />);
    expect(container).toMatchSnapshot();
  });
});
