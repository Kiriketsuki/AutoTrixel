import { getTriangleVertices } from "../logic/autotrixel/geometry.js";
import { validateAdapter } from "./canvas-adapter.js";

// TODO: renderGridDataToContext duplicates rendering logic from src/logic/autotrixel/export.js (L:17-100).
// Both should be consolidated into a shared rendering kernel. See epic/32 for tracking.
function renderGridDataToContext(ctx, gridData, config, triHeight, W_half, imageRegistry) {
    if (config.bgColor !== "transparent") {
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, config.width, config.height);
    }

    const drawSub = (p1, p2, p3, color) => {
        if (!color) return;
        if (typeof color === "object" && color.subdivided) {
            drawRecursive(p1, p2, p3, color);
            return;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
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
            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            ctx.lineTo(vertices[1].x, vertices[1].y);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.fillStyle = colorOrData;
            ctx.fill();
            ctx.strokeStyle = colorOrData;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        } else if (colorOrData && colorOrData.type === "image") {
            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            ctx.lineTo(vertices[1].x, vertices[1].y);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.clip();

            const img = imageRegistry ? imageRegistry.get(colorOrData.imageId) : null;
            if (img) {
                const vertices = getTriangleVertices(r, c, triHeight, W_half);
                const minX = Math.min(vertices[0].x, vertices[1].x, vertices[2].x);
                const maxX = Math.max(vertices[0].x, vertices[1].x, vertices[2].x);
                const minY = Math.min(vertices[0].y, vertices[1].y, vertices[2].y);
                const maxY = Math.max(vertices[0].y, vertices[1].y, vertices[2].y);
                const w = maxX - minX;
                const h = maxY - minY;

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

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            ctx.restore();
        } else if (colorOrData && colorOrData.subdivided) {
            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            drawRecursive(vertices[0], vertices[1], vertices[2], colorOrData);
        }
    });
}

export function renderToCanvas(engine, adapter) {
    validateAdapter(adapter);

    const config = engine.getConfig();
    const gridData = engine.getGridData();
    const { triHeight, W_half } = engine.getDerived();
    const imageRegistry = engine.getImageRegistry();

    const canvas = adapter.createCanvas(config.width, config.height);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, config.width, config.height);
    renderGridDataToContext(ctx, gridData, config, triHeight, W_half, imageRegistry);

    return canvas;
}

export function renderPNG(engine, adapter) {
    validateAdapter(adapter);
    const canvas = renderToCanvas(engine, adapter);
    return adapter.canvasToBlob(canvas);
}

/**
 * Render grid data to an SVG string using the headless engine.
 * Note: grid-line overlay is not supported in headless mode — the browser
 * export's grid-line toggle (exportGridToggle) has no headless equivalent.
 * For full SVG feature parity including grid lines, use exportSVGAsString
 * via createTrKixel (src/logic/autotrixel/export.js).
 */
export function renderSVG(engine) {
    const config = engine.getConfig();
    const gridData = engine.getGridData();
    const { triHeight, W_half } = engine.getDerived();

    const w = config.width;
    const h = config.height;
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

    svg += "</svg>";
    return svg;
}
