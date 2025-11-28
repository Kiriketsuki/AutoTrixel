import { getTrianglePath, getTriangleVertices } from "./geometry.js";

export function fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage) {
    artCtx.clearRect(0, 0, artCanvas.width, artCanvas.height);

    if (config.bgColor !== "transparent") {
        artCtx.fillStyle = config.bgColor;
        artCtx.fillRect(0, 0, artCanvas.width, artCanvas.height);
    }

    if (bgImage && bgImage.img) {
        artCtx.save();
        artCtx.globalAlpha = bgImage.opacity;
        artCtx.drawImage(bgImage.img, bgImage.x, bgImage.y, bgImage.img.width * bgImage.scale, bgImage.img.height * bgImage.scale);
        artCtx.restore();
    }

    const drawTriangle = (r, c, colorOrData, triHeight, W_half) => {
        if (typeof colorOrData === "string") {
            const path = getTrianglePath(r, c, triHeight, W_half);
            artCtx.fillStyle = colorOrData;
            artCtx.fill(path);
            artCtx.strokeStyle = colorOrData;
            artCtx.lineWidth = 0.5;
            artCtx.stroke(path);
        } else if (colorOrData && colorOrData.subdivided) {
            // Calculate sub-triangle dimensions and positions
            // This is tricky because getTrianglePath relies on integer grid coordinates.
            // We can't easily use getTrianglePath for sub-triangles unless we scale everything.
            // Instead, let's manually calculate vertices for the sub-triangles.

            const vertices = getTriangleVertices(r, c, triHeight, W_half);
            const [v0, v1, v2] = vertices;

            // Midpoints
            const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
            const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
            const m20 = { x: (v2.x + v0.x) / 2, y: (v2.y + v0.y) / 2 };

            const drawSub = (p1, p2, p3, color) => {
                if (!color) return;
                if (typeof color === "object" && color.subdivided) {
                    // Recursive drawing would require passing down the new vertices and handling depth
                    // For now, let's assume 1 level of subdivision or handle recursion by passing vertices
                    drawRecursive(p1, p2, p3, color);
                    return;
                }

                artCtx.beginPath();
                artCtx.moveTo(p1.x, p1.y);
                artCtx.lineTo(p2.x, p2.y);
                artCtx.lineTo(p3.x, p3.y);
                artCtx.closePath();
                artCtx.fillStyle = color;
                artCtx.fill();
                artCtx.strokeStyle = color;
                artCtx.lineWidth = 0.5;
                artCtx.stroke();
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

            drawRecursive(v0, v1, v2, colorOrData);
        }
    };

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        drawTriangle(r, c, gridData[key], triHeight, W_half);
    });

    if (config.showGrid) {
        drawGridLines(artCtx, artCanvas, config, triHeight, W_half);
    }
}

export function drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half) {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (hoveredCells.length === 0) return;

    cursorCtx.lineWidth = 2;
    cursorCtx.lineCap = "round";
    cursorCtx.lineJoin = "round";

    if (currentTool === "eraser") cursorCtx.strokeStyle = "#ff4444";
    else if (currentTool === "picker") cursorCtx.strokeStyle = "#ffff00";
    else if (currentTool === "bucket") cursorCtx.strokeStyle = "#00ff00";
    else cursorCtx.strokeStyle = "#ffffff";

    cursorCtx.shadowColor = "rgba(0,0,0,0.8)";
    cursorCtx.shadowBlur = 4;

    hoveredCells.forEach((cell) => {
        if (cell.subVertices) {
            cursorCtx.beginPath();
            cursorCtx.moveTo(cell.subVertices[0].x, cell.subVertices[0].y);
            cursorCtx.lineTo(cell.subVertices[1].x, cell.subVertices[1].y);
            cursorCtx.lineTo(cell.subVertices[2].x, cell.subVertices[2].y);
            cursorCtx.closePath();
            cursorCtx.stroke();
        } else {
            const path = getTrianglePath(cell.r, cell.c, triHeight, W_half);
            cursorCtx.stroke(path);
        }
    });

    cursorCtx.shadowColor = "transparent";
    cursorCtx.shadowBlur = 0;
}

export function drawGridLines(ctx, canvas, config, triHeight, W_half) {
    if (config.widthTriangles * config.heightTriangles > 400000) return;

    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    for (let r = 0; r <= config.heightTriangles; r++) {
        ctx.moveTo(0, r * triHeight);
        ctx.lineTo(canvas.width, r * triHeight);
    }

    for (let r = 0; r < config.heightTriangles; r++) {
        for (let c = 0; c < config.widthTriangles; c++) {
            const xBase = c * W_half;
            const yBase = r * triHeight;
            const isUp = r % 2 === Math.abs(c) % 2;
            if (isUp) {
                ctx.moveTo(xBase, yBase + triHeight);
                ctx.lineTo(xBase + W_half, yBase);
                ctx.lineTo(xBase + 2 * W_half, yBase + triHeight);
            } else {
                ctx.moveTo(xBase, yBase);
                ctx.lineTo(xBase + W_half, yBase + triHeight);
                ctx.lineTo(xBase + 2 * W_half, yBase);
            }
        }
    }
    ctx.stroke();
}
