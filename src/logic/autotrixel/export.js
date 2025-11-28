import { getTrianglePath } from "./geometry.js";
import { drawGridLines } from "./drawing.js";

export function exportImage(artCanvas, gridData, config, triHeight, W_half, exportGridToggle, showToast) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = artCanvas.width;
    tempCanvas.height = artCanvas.height;
    const tCtx = tempCanvas.getContext("2d");

    tCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    if (config.bgColor !== "transparent") {
        tCtx.fillStyle = config.bgColor;
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const color = gridData[key];
        const path = getTrianglePath(r, c, triHeight, W_half);
        tCtx.fillStyle = color;
        tCtx.fill(path);
        tCtx.strokeStyle = color;
        tCtx.lineWidth = 0.5;
        tCtx.stroke(path);
    });

    if (exportGridToggle.checked) {
        drawGridLines(tCtx, tempCanvas, config, triHeight, W_half);
    }

    tempCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "tripixel-art.png";
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showToast("Image Saved!");
    }, "image/png");
}

export function exportSVG(artCanvas, gridData, config, triHeight, W_half, exportGridToggle, showToast) {
    const w = artCanvas.width;
    const h = artCanvas.height;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

    if (config.bgColor !== "transparent") {
        svg += `<rect width="100%" height="100%" fill="${config.bgColor}"/>`;
    }

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const color = gridData[key];

        const xBase = c * W_half;
        const yBase = r * triHeight;
        const isUp = r % 2 === Math.abs(c) % 2;

        let points = "";
        if (isUp) {
            points = `${xBase},${yBase + triHeight} ${xBase + 2 * W_half},${yBase + triHeight} ${xBase + W_half},${yBase}`;
        } else {
            points = `${xBase},${yBase} ${xBase + 2 * W_half},${yBase} ${xBase + W_half},${yBase + triHeight}`;
        }

        svg += `<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
    });

    if (exportGridToggle.checked && config.widthTriangles * config.heightTriangles <= 400000) {
        const gridColor = config.gridColor;

        for (let r = 0; r <= config.heightTriangles; r++) {
            const y = r * triHeight;
            svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`;
        }

        for (let r = 0; r < config.heightTriangles; r++) {
            for (let c = 0; c < config.widthTriangles; c++) {
                const xBase = c * W_half;
                const yBase = r * triHeight;
                const isUp = r % 2 === Math.abs(c) % 2;

                let p = "";
                if (isUp) {
                    p = `${xBase},${yBase + triHeight} ${xBase + W_half},${yBase} ${xBase + 2 * W_half},${yBase + triHeight}`;
                } else {
                    p = `${xBase},${yBase} ${xBase + W_half},${yBase + triHeight} ${xBase + 2 * W_half},${yBase}`;
                }
                svg += `<polyline points="${p}" fill="none" stroke="${gridColor}" stroke-width="0.5"/>`;
            }
        }
    }

    svg += "</svg>";

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "tripixel-art.svg";
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast("SVG Saved!");
}
