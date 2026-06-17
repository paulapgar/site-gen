import { ImageSource, Loader } from "excalibur";

// It is convenient to put your resources in one place
export const Resources: Record<string, ImageSource> = {
  Sword: new ImageSource("./images/sword.png") // Vite public/ directory serves the root images
};

// Helper function to safely get resources with validation
export function getResource(name: string): ImageSource {
  if (!(name in Resources)) {
    console.error(`Resource not found: ${name}`);
    console.error(`Available resources: ${Object.keys(Resources).join(", ")}`);
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
