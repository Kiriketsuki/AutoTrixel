/**
 * Node.js canvas adapter (stub).
 *
 * To use headless PNG export in Node, install the "canvas" npm package:
 *   npm install canvas
 *
 * Then implement this adapter using node-canvas:
 *
 *   import { createCanvas } from "canvas";
 *
 *   export function createNodeCanvasAdapter() {
 *       return {
 *           createCanvas(width, height) {
 *               return createCanvas(width, height);
 *           },
 *           canvasToBlob(canvas) {
 *               return Promise.resolve(canvas.toBuffer("image/png"));
 *           },
 *       };
 *   }
 */
export function createNodeCanvasAdapter() {
    throw new Error(
        'Node canvas adapter not implemented. Install the "canvas" npm package and uncomment the implementation in src/core/adapters/node.js.',
    );
}
