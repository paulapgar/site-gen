import { Color, ImageSource, Loader, Rectangle, SpriteSheet } from 'excalibur';

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

// --- Sprite Sheet Loader ---

/**
 * Represents a single tile entry in the sprite-sheet JSON config.
 *
 * Each tile is identified by a `name` and positioned on the sprite sheet
 * using integer `row` and `col` indices within the grid defined by
 * {@link SpriteSheetConfig.gridWidth} / {@link SpriteSheetConfig.gridHeight}.
 */
export interface TileConfig {
  /** Unique name used to look up this tile in the `Resources` record. */
  name: string;
  /** Zero-based row index on the sprite sheet grid. */
  row: number;
  /** Zero-based column index on the sprite sheet grid. */
  col: number;
}

/**
 * Represents the full JSON configuration for a sprite sheet.
 *
 * The file must declare the grid dimensions (`gridWidth`, `gridHeight`) and
 * an array of {@link TileConfig} entries describing each tile's name and
 * position on the sheet.
 */
export interface SpriteSheetConfig {
  /** Number of columns in the sprite sheet grid. */
  gridWidth: number;
  /** Number of rows in the sprite sheet grid. */
  gridHeight: number;
  /** Array of tile definitions mapping names to grid positions. */
  tiles: TileConfig[];
}

/**
 * Loads a sprite-sheet JSON config and registers each tile as an `ImageSource`
 * extracted from the sprite sheet image using row/col grid positions.
 *
 * Fetches the JSON configuration file, loads the sprite sheet image, creates a SpriteSheet
 * from it, extracts individual sprites using Excalibur's getSprite() method, and merges them
 * into the shared `Resources` record so they can be looked up by name using {@link getResource}.
 *
 * @param configPath - Path to the JSON configuration file (e.g. `'./configs/castle-tiles.json'`).
 *   The JSON must contain `gridWidth`, `gridHeight`, and a `tiles` array where each entry has
 *   `name`, `row`, and `col` fields.
 * @param sheetPath - Path to the sprite sheet image file relative to the Vite public directory.
 *   Defaults to `'./images/tiles.png'`.
 * @returns A record mapping tile names to their corresponding `ImageSource` instances, also merged
 *   into the global `Resources` object for convenience.
 * @throws {Error} When the config file cannot be fetched or parsed.
 *
 * @example
 * ```ts
 * // In your engine initialization:
 * await loadSpriteSheet('./configs/castle-tiles.json');
 *
 * // Later, access a tile by name:
 * const wallTile = Resources['wall_h'];
 * ```
 */
export async function loadSpriteSheet(
  configPath: string,
  sheetPath: string = './images/tiles.png'
): Promise<Record<string, ImageSource>> {
  const response = await fetch(configPath);
  if (!response.ok) {
    throw new Error(
      `Failed to load sprite-sheet config from ${configPath}: ${response.statusText}`
    );
  }
  const config: SpriteSheetConfig = await response.json();

  // Load the sprite sheet image and create a SpriteSheet
  const sheetImage = new ImageSource(sheetPath);
  await sheetImage.load();

  const spriteSheet = SpriteSheet.fromImageSource({
    image: sheetImage,
    grid: {
      rows: config.gridHeight,
      columns: config.gridWidth,
      spriteWidth: sheetImage.image.width / config.gridWidth,
      spriteHeight: sheetImage.image.height / config.gridHeight,
    },
  });

  const sprites: Record<string, ImageSource> = {};

  for (const tile of config.tiles) {
    const sprite = spriteSheet.getSprite(tile.col, tile.row);
    sprites[tile.name] = sprite.image;
  }

  // Merge into the global Resources record
  Object.assign(Resources, sprites);

  return sprites;
}
