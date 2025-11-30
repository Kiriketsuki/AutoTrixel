import { getTrianglePath, getTriangleVertices } from "./geometry.js";
import { drawGridLines } from "./drawing.js";

export function exportImage(artCanvas, gridData, config, triHeight, W_half, exportGridToggle, showToast, imageRegistry) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = artCanvas.width;
    tempCanvas.height = artCanvas.height;
    const tCtx = tempCanvas.getContext("2d");

    tCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    if (config.bgColor !== "transparent") {
        tCtx.fillStyle = config.bgColor;
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    const drawSub = (p1, p2, p3, color) => {
        if (!color) return;
        if (typeof color === "object" && color.subdivided) {
            drawRecursive(p1, p2, p3, color);
            return;
        }

        tCtx.beginPath();
        tCtx.moveTo(p1.x, p1.y);
        tCtx.lineTo(p2.x, p2.y);
        tCtx.lineTo(p3.x, p3.y);
        tCtx.closePath();
        tCtx.fillStyle = color;
        tCtx.fill();
        tCtx.strokeStyle = color;
        tCtx.lineWidth = 0.5;
        tCtx.stroke();
    };

    const drawRecursive = (p1, p2, p3, data) => {
        const m01 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const m12 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        const m20 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 };

        drawSub(p1, m01, m20, data.children[0]);
        drawSub(m01, p2, m12, data.children[1]);
        drawSub(m20, m12, p3, data.children[2]);
        drawSub(m01, m12, m20, data.children[3]);
    };

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const colorOrData = gridData[key];

        if (typeof colorOrData === "string") {
            const path = getTrianglePath(r, c, triHeight, W_half);
            tCtx.fillStyle = colorOrData;
            tCtx.fill(path);
            tCtx.strokeStyle = colorOrData;
            tCtx.lineWidth = 0.5;
            tCtx.stroke(path);
        } else if (colorOrData && colorOrData.type === "image") {
            const path = getTrianglePath(r, c, triHeight, W_half);
            tCtx.save();
            tCtx.clip(path);

            const img = imageRegistry ? imageRegistry.get(colorOrData.imageId) : null;
            if (img) {
                const vertices = getTriangleVertices(r, c, triHeight, W_half);
                const minX = Math.min(vertices[0].x, vertices[1].x, vertices[2].x);
                const maxX = Math.max(vertices[0].x, vertices[1].x, vertices[2].x);
                const minY = Math.min(vertices[0].y, vertices[1].y, vertices[2].y);
                const maxY = Math.max(vertices[0].y, vertices[1].y, vertices[2].y);
                const w = maxX - minX;
                const h = maxY - minY;

                // Cover logic
                const imgRatio = img.width / img.height;
                const triRatio = w / h;

                let drawW, drawH, drawX, drawY;

                if (imgRatio > triRatio) {
                    drawH = h;
                    drawW = h * imgRatio;
                    drawX = minX - (drawW - w) / 2;
                    drawY = minY;
                } else {
                    drawW = w;
                    drawH = w / imgRatio;
                    drawX = minX;
                    drawY = minY - (drawH - h) / 2;
                }

                tCtx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            tCtx.restore();
        } else if (colorOrData && colorOrData.subdivided) {
            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            drawRecursive(vertices[0], vertices[1], vertices[2], colorOrData);
        }
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

    const generateSubSvg = (p1, p2, p3, color) => {
        if (!color) return "";
        if (typeof color === "object" && color.subdivided) {
            return generateRecursiveSvg(p1, p2, p3, color);
        }
        const points = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
        return `<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
    };

    const generateRecursiveSvg = (p1, p2, p3, data) => {
        const m01 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const m12 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        const m20 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 };

        let s = "";
        s += generateSubSvg(p1, m01, m20, data.children[0]);
        s += generateSubSvg(m01, p2, m12, data.children[1]);
        s += generateSubSvg(m20, m12, p3, data.children[2]);
        s += generateSubSvg(m01, m12, m20, data.children[3]);
        return s;
    };

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const colorOrData = gridData[key];

        if (typeof colorOrData === "string") {
            const xBase = c * W_half;
            const yBase = r * triHeight;
            const isUp = r % 2 === Math.abs(c) % 2;

            let points = "";
            if (isUp) {
                points = `${xBase},${yBase + triHeight} ${xBase + 2 * W_half},${yBase + triHeight} ${xBase + W_half},${yBase}`;
            } else {
                points = `${xBase},${yBase} ${xBase + 2 * W_half},${yBase} ${xBase + W_half},${yBase + triHeight}`;
            }
            svg += `<polygon points="${points}" fill="${colorOrData}" stroke="${colorOrData}" stroke-width="0.5"/>`;
        } else if (colorOrData && colorOrData.subdivided) {
            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            svg += generateRecursiveSvg(vertices[0], vertices[1], vertices[2], colorOrData);
        }
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
