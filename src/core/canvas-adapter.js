/**
 * Canvas Adapter Interface
 *
 * Adapters must implement:
 *
 *   createCanvas(width, height) → canvas-like object
 *     Returns an object with:
 *       - width, height properties
 *       - getContext('2d') → CanvasRenderingContext2D-compatible object
 *
 *   canvasToBlob(canvas) → Promise<Blob|Buffer>
 *     Converts the canvas contents to PNG as a Blob (browser) or Buffer (Node).
 *
 * See src/core/adapters/browser.js and src/core/adapters/node.js for implementations.
 */

export function validateAdapter(adapter) {
    if (typeof adapter.createCanvas !== "function") {
        throw new Error("Canvas adapter must implement createCanvas(width, height)");
    }
    if (typeof adapter.canvasToBlob !== "function") {
        throw new Error("Canvas adapter must implement canvasToBlob(canvas)");
    }
    return adapter;
}
