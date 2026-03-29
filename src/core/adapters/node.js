export async function createNodeCanvasAdapter() {
    let canvasModule;
    try {
        canvasModule = await import("canvas");
    } catch {
        throw new Error(
            'PNG export requires the "canvas" npm package. Install it with: npm install canvas',
        );
    }
    const { createCanvas } = canvasModule;
    return {
        createCanvas(width, height) {
            return createCanvas(width, height);
        },
        canvasToBlob(canvas) {
            return Promise.resolve(canvas.toBuffer("image/png"));
        },
    };
}
