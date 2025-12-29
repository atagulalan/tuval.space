import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { ColorPicker, COLOR_PALETTES } from './ColorPicker';

describe('ColorPicker', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ColorPicker
        selectedColor="#FF0000"
        onColorChange={() => {}}
        colors={COLOR_PALETTES[0].colors}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with different palette', () => {
    const { container } = render(
      <ColorPicker
        selectedColor="#FFE5E5"
        onColorChange={() => {}}
        colors={COLOR_PALETTES[1].colors}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
