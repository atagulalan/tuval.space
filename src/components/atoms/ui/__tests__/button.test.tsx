import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should match snapshot', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with variant', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with size', () => {
    const { container } = render(<Button size="lg">Large Button</Button>);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when disabled', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container).toMatchSnapshot();
  });
});
