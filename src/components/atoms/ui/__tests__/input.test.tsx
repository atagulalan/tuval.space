import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('should match snapshot', () => {
    const { container } = render(<Input placeholder="Enter text" />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with type', () => {
    const { container } = render(
      <Input type="password" placeholder="Password" />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when disabled', () => {
    const { container } = render(<Input disabled placeholder="Disabled" />);
    expect(container).toMatchSnapshot();
  });
});
