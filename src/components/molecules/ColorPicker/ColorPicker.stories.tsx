import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker, COLOR_PALETTES } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

const DefaultComponent = () => {
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  return (
    <ColorPicker
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
      colors={COLOR_PALETTES[0].colors}
    />
  );
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const ClassicPaletteComponent = () => {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  return (
    <ColorPicker
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
      colors={COLOR_PALETTES[0].colors}
    />
  );
};

export const ClassicPalette: Story = {
  render: () => <ClassicPaletteComponent />,
};

const PastelPaletteComponent = () => {
  const [selectedColor, setSelectedColor] = useState('#FFE5E5');
  return (
    <ColorPicker
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
      colors={COLOR_PALETTES[1].colors}
    />
  );
};

export const PastelPalette: Story = {
  render: () => <PastelPaletteComponent />,
};

const VibrantPaletteComponent = () => {
  const [selectedColor, setSelectedColor] = useState('#FF1744');
  return (
    <ColorPicker
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
      colors={COLOR_PALETTES[2].colors}
    />
  );
};

export const VibrantPalette: Story = {
  render: () => <VibrantPaletteComponent />,
};
