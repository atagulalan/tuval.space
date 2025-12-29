import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  it('should match snapshot', () => {
    const { container } = render(<Label htmlFor="test">Test Label</Label>);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot without htmlFor', () => {
    const { container } = render(<Label>Standalone Label</Label>);
    expect(container).toMatchSnapshot();
  });
});
