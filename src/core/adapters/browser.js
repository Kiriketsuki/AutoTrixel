export function createBrowserCanvasAdapter() {
    return {
        createCanvas(width, height) {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas;
        },

        canvasToBlob(canvas) {
            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png");
            });
        },
    };
}
