import { Color, ImageSource, Loader, Rectangle } from 'excalibur';

// Rainbow color palette (5 shades per color)
const rainbowColors = [
  // Red shades
  { name: 'redLight', color: '#FFB3B3' },
  { name: 'redMedium', color: '#FF6666' },
  { name: 'red', color: '#FF0000' },
  { name: 'redDark', color: '#CC0000' },
  { name: 'redDark2', color: '#990000' },
  // Orange shades
  { name: 'orangeLight', color: '#FFD9B3' },
  { name: 'orangeMedium', color: '#FF9933' },
  { name: 'orange', color: '#FF6600' },
  { name: 'orangeDark', color: '#CC5200' },
  { name: 'orangeDark2', color: '#993300' },
  // Yellow shades
  { name: 'yellowLight', color: '#FFFFB3' },
  { name: 'yellowMedium', color: '#FFFF66' },
  { name: 'yellow', color: '#FFCC00' },
  { name: 'yellowDark', color: '#CC9900' },
  { name: 'yellowDark2', color: '#996600' },
  // Green shades
  { name: 'greenLight', color: '#B3FFB3' },
  { name: 'greenMedium', color: '#66FF66' },
  { name: 'green', color: '#00CC00' },
  { name: 'greenDark', color: '#009900' },
  { name: 'greenDark2', color: '#006600' },
  // Blue shades
  { name: 'blueLight', color: '#B3D9FF' },
  { name: 'blueMedium', color: '#6699FF' },
  { name: 'blue', color: '#0066FF' },
  { name: 'blueDark', color: '#0033CC' },
  { name: 'blueDark2', color: '#000099' },
  // Indigo shades (darker, more purple)
  { name: 'indigoLight', color: '#6A5ACD' },
  { name: 'indigoMedium', color: '#483D8B' },
  { name: 'indigo', color: '#4B0082' },
  { name: 'indigoDark', color: '#3A006F' },
  { name: 'indigoDark2', color: '#2E0051' },
  // Violet shades (lighter, more pinkish)
  { name: 'violetLight', color: '#EE82EE' },
  { name: 'violetMedium', color: '#DA70D6' },
  { name: 'violet', color: '#BA55D3' },
  { name: 'violetDark', color: '#9B31D5' },
  { name: 'violetDark2', color: '#8A2BE2' },
  // Brown shades
  { name: 'brownLight', color: '#CD853F' },
  { name: 'brownMedium', color: '#A0522D' },
  { name: 'brown', color: '#8B4513' },
  { name: 'brownDark', color: '#654321' },
  { name: 'brownDark2', color: '#4E342E' },
  // Gray shades
  { name: 'gray65', color: '#414141' },
  { name: 'gray75', color: '#4B4B4B' },
  { name: 'gray85', color: '#555555' },
  { name: 'gray95', color: '#5F5F5F' },
  { name: 'gray105', color: '#696969' },
  { name: 'gray115', color: '#737373' },
  { name: 'gray125', color: '#7D7D7D' },
  { name: 'gray135', color: '#878787' },
  { name: 'gray145', color: '#919191' },
  { name: 'gray155', color: '#9B9B9B' },
  { name: 'gray165', color: '#A5A5A5' },
  { name: 'gray175', color: '#AFAFAF' },
  { name: 'gray185', color: '#B9B9B9' },
  { name: 'gray195', color: '#C3C3C3' },
  { name: 'gray205', color: '#CDCDCD' },
  { name: 'gray215', color: '#D7D7D7' },
  { name: 'gray225', color: '#E1E1E1' },
  { name: 'gray235', color: '#EBEBEB' },
  { name: 'gray245', color: '#F5F5F5' },
  { name: 'gray255', color: '#FFFFFF' },
];

// Generate all color squares
const colorSquares = rainbowColors.map(({ name, color }) => ({
  name,
  image: new Rectangle({ width: 8, height: 8, color: Color.fromHex(color) }),
}));

// It is convenient to put your resources in one place
export const Resources: Record<string, ImageSource> = {
  Sword: new ImageSource('./images/sword.png'), // Vite public/ directory serves the root images
  ...colorSquares.reduce((acc, { name, image }) => ({ ...acc, [name]: image }), {}),
};

// Helper function to safely get resources with validation
export function getResource(name: string): ImageSource {
  if (!(name in Resources)) {
    console.error(`Resource not found: ${name}`);
    console.error(`Available resources: ${Object.keys(Resources).join(', ')}`);
    throw new Error(`Resource '${name}' not found in Resources object`);
  }
  return Resources[name];
}

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();

for (const res of Object.values(Resources)) {
  loader.addResource(res);
}
