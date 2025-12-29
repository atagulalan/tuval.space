#!/usr/bin/env node

/**
 * Image to Palette Converter
 * 
 * Converts an image to match one of the tuval.space color palettes
 * and outputs it as a PNG file along with the array representation.
 * 
 * Usage:
 *   tsx scripts/image-to-palette.ts <input-image> [palette-id] [output-name]
 * 
 * Example:
 *   tsx scripts/image-to-palette.ts image.jpg classic output
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

// Color palettes from the project
interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // Exactly 8 colors
}

const COLOR_PALETTES: ColorPalette[] = [
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

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Calculate Euclidean distance between two RGB colors
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

// Find the closest palette color for a given RGB color
function findClosestPaletteColor(
  rgb: [number, number, number],
  palette: ColorPalette
): string {
  let closestColor = palette.colors[0];
  let minDistance = Infinity;

  for (const hexColor of palette.colors) {
    const paletteRgb = hexToRgb(hexColor);
    const distance = colorDistance(rgb, paletteRgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = hexColor;
    }
  }

  return closestColor;
}

// Load palette from JSON file
function loadPaletteFromFile(filePath: string): ColorPalette {
  try {
    const fullPath = join(process.cwd(), filePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Palette file not found: ${filePath}`);
    }

    const fileContent = readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Support both formats: { colors: [...] } or just [...]
    const colors = Array.isArray(data) ? data : (data.colors || []);

    if (!Array.isArray(colors) || colors.length === 0) {
      throw new Error('Invalid palette format: colors must be a non-empty array');
    }

    // Validate hex colors
    for (const color of colors) {
      if (typeof color !== 'string' || !/^#?[a-f\d]{6}$/i.test(color)) {
        throw new Error(`Invalid hex color in palette: ${color}`);
      }
    }

    // Normalize hex colors (ensure they start with #)
    const normalizedColors = colors.map((color: string) => 
      color.startsWith('#') ? color : `#${color}`
    );

    return {
      id: 'custom',
      name: data.name || 'Custom Palette',
      colors: normalizedColors,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load palette from file: ${error.message}`);
    }
    throw error;
  }
}

// Load palette from comma-separated hex colors string
function loadPaletteFromString(colorString: string): ColorPalette {
  const colors = colorString.split(',').map((c) => c.trim()).filter((c) => c.length > 0);

  if (colors.length === 0) {
    throw new Error('Palette string must contain at least one color');
  }

  // Validate and normalize hex colors
  const normalizedColors = colors.map((color) => {
    if (!/^#?[a-f\d]{6}$/i.test(color)) {
      throw new Error(`Invalid hex color: ${color}`);
    }
    return color.startsWith('#') ? color : `#${color}`;
  });

  return {
    id: 'custom',
    name: 'Custom Palette',
    colors: normalizedColors,
  };
}

// Convert image to palette
async function convertImageToPalette(
  inputPath: string,
  palette: ColorPalette,
  outputPath: string
): Promise<{ width: number; height: number; array: string[][] }> {

  console.log(`Using palette: ${palette.name} (${palette.id})`);
  console.log(`Palette colors: ${palette.colors.join(', ')}`);

  // Load and get image metadata
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  console.log(`Input image: ${width}x${height} pixels`);

  // Get raw pixel data (RGBA)
  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Process each pixel
  const outputArray: string[][] = [];
  const outputBuffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Find closest palette color
      const closestColor = findClosestPaletteColor([r, g, b], palette);
      const closestRgb = hexToRgb(closestColor);

      // Set output pixel
      outputBuffer[idx] = closestRgb[0];
      outputBuffer[idx + 1] = closestRgb[1];
      outputBuffer[idx + 2] = closestRgb[2];
      outputBuffer[idx + 3] = a; // Preserve alpha

      row.push(closestColor);
    }
    outputArray.push(row);
  }

  // Create output image
  await sharp(outputBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);

  console.log(`Output saved to: ${outputPath}`);

  return { width, height, array: outputArray };
}

// Save array representation as JSON
function saveArrayToFile(array: string[][], outputPath: string): void {
  const jsonContent = JSON.stringify(array, null, 2);
  writeFileSync(outputPath, jsonContent, 'utf-8');
  console.log(`Array saved to: ${outputPath}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Image to Palette Converter

Usage:
  tsx scripts/image-to-palette.ts <input-image> [palette-id] [output-name]
  tsx scripts/image-to-palette.ts <input-image> --palette-file <json-file> [output-name]
  tsx scripts/image-to-palette.ts <input-image> --palette <hex-colors> [output-name]

Arguments:
  input-image      Path to the input image (jpg, png, etc.)
  palette-id       Palette ID to use (default: classic)
                   Available: ${COLOR_PALETTES.map((p) => p.id).join(', ')}
  output-name      Custom name prefix for output files (optional)
                   Format: {output-name}-{palette-id}.{ext}
                   If not specified: {input-filename}-{palette-id}.{ext}

Options:
  --palette-file   Load palette from JSON file
                   JSON format: { "colors": ["#FFFFFF", "#000000", ...] }
                   or just: ["#FFFFFF", "#000000", ...]
  --palette        Load palette from comma-separated hex colors
                   Example: --palette "#FFFFFF,#000000,#FF0000"

Examples:
  # Use built-in palette
  tsx scripts/image-to-palette.ts image.jpg
  # Output: image-classic.png, image-classic.json
  
  tsx scripts/image-to-palette.ts image.jpg vibrant
  # Output: image-vibrant.png, image-vibrant.json
  
  # Use custom palette from JSON file
  tsx scripts/image-to-palette.ts image.jpg --palette-file my-palette.json
  # Output: image-custom.png, image-custom.json
  
  # Use custom palette from command line
  tsx scripts/image-to-palette.ts image.jpg --palette "#FFFFFF,#000000,#FF0000,#00FF00"
  # Output: image-custom.png, image-custom.json

Output:
  - {name}-{palette-id}.png: Quantized image matching the palette
  - {name}-{palette-id}.json: 2D array of hex color values
`);
    process.exit(0);
  }

  const inputPath = args[0];
  let palette: ColorPalette;
  let paletteId: string;
  let outputNameArg: string | undefined;

  // Check for --palette-file or --palette options
  const paletteFileIndex = args.indexOf('--palette-file');
  const paletteStringIndex = args.indexOf('--palette');

  if (paletteFileIndex !== -1) {
    // Load palette from file
    const paletteFilePath = args[paletteFileIndex + 1];
    if (!paletteFilePath) {
      console.error('❌ Error: --palette-file requires a file path');
      process.exit(1);
    }
    palette = loadPaletteFromFile(paletteFilePath);
    paletteId = 'custom';
    // Get output name (if provided after palette file)
    outputNameArg = args[paletteFileIndex + 2];
  } else if (paletteStringIndex !== -1) {
    // Load palette from string
    const paletteString = args[paletteStringIndex + 1];
    if (!paletteString) {
      console.error('❌ Error: --palette requires comma-separated hex colors');
      process.exit(1);
    }
    palette = loadPaletteFromString(paletteString);
    paletteId = 'custom';
    // Get output name (if provided after palette string)
    outputNameArg = args[paletteStringIndex + 2];
  } else {
    // Use built-in palette
    paletteId = args[1] || 'classic';
    const foundPalette = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (!foundPalette) {
      throw new Error(`Palette '${paletteId}' not found. Available palettes: ${COLOR_PALETTES.map((p) => p.id).join(', ')}`);
    }
    palette = foundPalette;
    outputNameArg = args[2];
  }
  
  // Get base name from input file or user-specified name
  const inputBaseName = basename(inputPath, extname(inputPath));
  
  // Format: {isim}-{palette}
  const outputBaseName = outputNameArg 
    ? `${outputNameArg}-${paletteId}`
    : `${inputBaseName}-${paletteId}`;

  // Resolve paths
  const inputFullPath = join(process.cwd(), inputPath);
  const outputDir = dirname(inputFullPath);
  const outputPngPath = join(outputDir, `${outputBaseName}.png`);
  const outputJsonPath = join(outputDir, `${outputBaseName}.json`);

  try {
    console.log(`\nConverting image: ${inputPath}`);
    console.log(`Palette: ${palette.name} (${palette.id})`);
    console.log(`Palette colors: ${palette.colors.join(', ')}`);
    console.log(`Output base name: ${outputBaseName}\n`);

    const result = await convertImageToPalette(inputFullPath, palette, outputPngPath);
    saveArrayToFile(result.array, outputJsonPath);

    console.log(`\n✅ Conversion complete!`);
    console.log(`   Image: ${outputPngPath}`);
    console.log(`   Array: ${outputJsonPath}`);
    console.log(`   Dimensions: ${result.width}x${result.height}`);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

