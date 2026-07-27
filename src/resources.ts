import { ImageSource, Loader, Rectangle } from 'excalibur';
import { colorSquares, loadSpriteSheet } from './util/sprites';

// It is convenient to put your resources in one place
export const Resources: Record<string, ImageSource | Rectangle> = {
  Sword: new ImageSource('./images/sword.png'), // Vite public/ directory serves the root images
  ...colorSquares.reduce((acc, { name, image }) => ({ ...acc, [name]: image }), {}),
};

// Helper function to safely get resources with validation
export function getResource(name: string): ImageSource {
  const resource = Resources[name];
  if (!(resource instanceof ImageSource)) {
    console.error(`Resource not found: ${name}`);
    console.error(`Available resources: ${Object.keys(Resources).join(', ')}`);
    throw new Error(`Resource '${name}' not found in Resources object`);
  }
  return resource;
}

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();

loadSpriteSheet('./configs/spritemap.json').then((sprites) => {
  Object.assign(Resources, sprites);
  // for (const sprite of Object.values(sprites)) {
  //   loader.addResource(sprite);
  // }
});

for (const res of Object.values(Resources)) {
  if (res instanceof ImageSource) {
    loader.addResource(res);
  }
}

console.log('Resources loaded:', Object.keys(Resources));
