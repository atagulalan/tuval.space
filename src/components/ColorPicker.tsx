import React from 'react';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // Exactly 8 colors
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'classic',
    name: 'Classic',
    colors: [
      '#FFFFFF', // White
      '#000000', // Black
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: [
      '#FFE5E5', // Light Pink
      '#E5FFE5', // Light Green
      '#E5E5FF', // Light Blue
      '#FFFFE5', // Light Yellow
      '#FFE5FF', // Light Magenta
      '#E5FFFF', // Light Cyan
      '#FFE5CC', // Light Orange
      '#E5CCFF', // Light Purple
    ],
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    colors: [
      '#FF1744', // Bright Red
      '#00E676', // Bright Green
      '#2979FF', // Bright Blue
      '#FFD600', // Bright Yellow
      '#D500F9', // Bright Magenta
      '#00E5FF', // Bright Cyan
      '#FF6D00', // Bright Orange
      '#7C4DFF', // Bright Purple
    ],
  },
  {
    id: 'monochrome',
    name: 'Mono',
    colors: [
      '#FFFFFF', // White
      '#E0E0E0', // Light Gray
      '#9E9E9E', // Medium Gray
      '#616161', // Dark Gray
      '#424242', // Darker Gray
      '#212121', // Very Dark Gray
      '#0A0A0A', // Almost Black
      '#000000', // Black
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: [
      '#E0F7FA', // Light Cyan
      '#B2EBF2', // Pale Cyan
      '#4DD0E1', // Cyan
      '#26C6DA', // Dark Cyan
      '#00BCD4', // Teal
      '#0097A7', // Dark Teal
      '#00838F', // Darker Teal
      '#006064', // Deep Teal
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: [
      '#E8F5E9', // Light Green
      '#C8E6C9', // Pale Green
      '#A5D6A7', // Light Green
      '#81C784', // Green
      '#66BB6A', // Medium Green
      '#4CAF50', // Dark Green
      '#388E3C', // Darker Green
      '#2E7D32', // Deep Green
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: [
      '#FFF3E0', // Light Orange
      '#FFE0B2', // Pale Orange
      '#FFCC80', // Light Orange
      '#FFB74D', // Orange
      '#FFA726', // Medium Orange
      '#FF9800', // Dark Orange
      '#F57C00', // Darker Orange
      '#E65100', // Deep Orange
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: [
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
      '#00FF00', // Green
      '#FFFF00', // Yellow
      '#FF0080', // Pink
      '#8000FF', // Purple
      '#00FF80', // Aqua
      '#FF8000', // Orange
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    colors: [
      '#F5F5DC', // Beige
      '#DEB887', // Burlywood
      '#D2691E', // Chocolate
      '#8B4513', // Saddle Brown
      '#A0522D', // Sienna
      '#654321', // Dark Brown
      '#3E2723', // Dark Brown
      '#1B0000', // Very Dark Brown
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: [
      '#E3F2FD', // Light Blue
      '#BBDEFB', // Pale Blue
      '#90CAF9', // Light Blue
      '#64B5F6', // Blue
      '#42A5F5', // Medium Blue
      '#2196F3', // Dark Blue
      '#1976D2', // Darker Blue
      '#0D47A1', // Deep Blue
    ],
  },
];

// Helper function to get palette by ID
export const getPaletteById = (id: string): ColorPalette | undefined => {
  return COLOR_PALETTES.find((palette) => palette.id === id);
};

// Helper function to get random palette ID
export const getRandomPaletteId = (): string => {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTES.length);
  return COLOR_PALETTES[randomIndex].id;
};

// Legacy export for backward compatibility (first color of classic palette)
export const PRESET_COLORS = COLOR_PALETTES[0].colors;

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  colors: string[]; // Array of colors to display (8 colors)
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  colors,
}) => {
  const handlePresetClick = (color: string) => {
    onColorChange(color);
  };

  return (
    <div className="p-4">
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-8 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
              selectedColor === color
                ? 'border-white'
                : 'border-white/20 hover:border-white/40'
            }`}
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
};
