export function getTrianglePath(r, c, triHeight, W_half) {
    const path = new Path2D();
    const xBase = c * W_half;
    const yBase = r * triHeight;
    const isUp = r % 2 === Math.abs(c) % 2;

    if (isUp) {
        path.moveTo(xBase, yBase + triHeight);
        path.lineTo(xBase + 2 * W_half, yBase + triHeight);
        path.lineTo(xBase + W_half, yBase);
        path.closePath();
    } else {
        path.moveTo(xBase, yBase);
        path.lineTo(xBase + 2 * W_half, yBase);
        path.lineTo(xBase + W_half, yBase + triHeight);
        path.closePath();
    }
    return path;
}

export function pixelToGrid(x, y, triHeight, W_half, config) {
    const row = Math.floor(y / triHeight);
    const colApprox = Math.floor(x / W_half);
    const localX = (x % W_half) / W_half;
    const localY = (y % triHeight) / triHeight;
    let finalCol = -1;
    const parity = (colApprox + row) % 2;

    if (parity === 0) {
        const isEvenRow = row % 2 === 0;
        if (isEvenRow) {
            if (colApprox % 2 === 0) {
                finalCol = localX + localY >= 1 ? colApprox : colApprox - 1;
            } else {
                finalCol = localY >= localX ? colApprox - 1 : colApprox;
            }
        } else {
            if (colApprox % 2 === 0) {
                finalCol = localX >= localY ? colApprox : colApprox - 1;
            } else {
                finalCol = localX + localY <= 1 ? colApprox - 1 : colApprox;
            }
        }
    } else {
        const isEvenRow = row % 2 === 0;
        if (isEvenRow) {
            if (colApprox % 2 !== 0) {
                finalCol = localX + localY >= 1 ? colApprox : colApprox - 1;
            } else {
                finalCol = localY >= localX ? colApprox - 1 : colApprox;
            }
        } else {
            if (colApprox % 2 !== 0) {
                finalCol = localX >= localY ? colApprox : colApprox - 1;
            } else {
                finalCol = localX + localY <= 1 ? colApprox - 1 : colApprox;
            }
        }
    }

    if (row < 0 || row >= config.heightTriangles) return null;
    if (finalCol < 0 || finalCol >= config.widthTriangles) return null;

    return { r: row, c: finalCol };
}

export function getTriangleCluster(r, c, size, config) {
    if (size <= 1) return [{ r, c }];
    const coords = [];
    const isUp = r % 2 === Math.abs(c) % 2;
    for (let i = 0; i < size; i++) {
        const currentRow = isUp ? r + i : r - i;
        const startCol = c - i;
        const endCol = c + i;
        for (let col = startCol; col <= endCol; col++) {
            if (currentRow >= 0 && currentRow < config.heightTriangles && col >= 0 && col < config.widthTriangles) {
                coords.push({ r: currentRow, c: col });
            }
        }
    }
    return coords;
}

export function findBestCenter(targetR, targetC, size, config) {
    if (size <= 1) return { r: targetR, c: targetC };

    let bestAnchor = { r: targetR, c: targetC };
    let minDist = Infinity;
    const range = Math.ceil(size / 2) + 1;

    for (let dr = -range; dr <= range; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const r = targetR + dr;
            const c = targetC + dc;

            if (r < -size || r > config.heightTriangles + size || c < -size || c > config.widthTriangles + size) continue;

            const cluster = getTriangleCluster(r, c, size, config);
            if (cluster.length === 0) continue;

            let sumR = 0;
            let sumC = 0;
            for (const cell of cluster) {
                sumR += cell.r;
                sumC += cell.c;
            }
            const avgR = sumR / cluster.length;
            const avgC = sumC / cluster.length;

            const dist = (avgR - targetR) ** 2 + (avgC - targetC) ** 2;
            if (dist < minDist) {
                minDist = dist;
                bestAnchor = { r, c };
            }
        }
    }
    return bestAnchor;
}

export function getTriangleVertices(r, c, triHeight, W_half) {
    const xBase = c * W_half;
    const yBase = r * triHeight;
    const isUp = r % 2 === Math.abs(c) % 2;

    if (isUp) {
        return [
            { x: xBase, y: yBase + triHeight }, // Bottom Left
            { x: xBase + 2 * W_half, y: yBase + triHeight }, // Bottom Right
            { x: xBase + W_half, y: yBase }, // Top Center
        ];
    } else {
        return [
            { x: xBase, y: yBase }, // Top Left
            { x: xBase + 2 * W_half, y: yBase }, // Top Right
            { x: xBase + W_half, y: yBase + triHeight }, // Bottom Center
        ];
    }
}

export function getBarycentric(p, a, b, c) {
    const v0 = { x: b.x - a.x, y: b.y - a.y };
    const v1 = { x: c.x - a.x, y: c.y - a.y };
    const v2 = { x: p.x - a.x, y: p.y - a.y };

    const d00 = v0.x * v0.x + v0.y * v0.y;
    const d01 = v0.x * v1.x + v0.y * v1.y;
    const d11 = v1.x * v1.x + v1.y * v1.y;
    const d20 = v2.x * v0.x + v2.y * v0.y;
    const d21 = v2.x * v1.x + v2.y * v1.y;

    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1.0 - v - w;

    return { u, v, w };
}

export function findBestCenterPixel(x, y, size, config, triHeight, W_half) {
    // Approximate grid coordinate
    const approxCell = pixelToGrid(x, y, triHeight, W_half, config);
    if (!approxCell) return null;

    let bestAnchor = { r: approxCell.r, c: approxCell.c };
    let minDist = Infinity;

    // Search range around the approximate cell
    const range = 2; // Check 2 cells in each direction

    for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
            const r = approxCell.r + dr;
            const c = approxCell.c + dc;

            // Get the cluster for this potential anchor
            const cluster = getTriangleCluster(r, c, size, config);
            if (cluster.length === 0) continue;

            // Calculate centroid of the cluster
            let sumX = 0;
            let sumY = 0;
            cluster.forEach((cell) => {
                const vertices = getTriangleVertices(cell.r, cell.c, triHeight, W_half);
                // Centroid of a triangle is average of vertices
                const cx = (vertices[0].x + vertices[1].x + vertices[2].x) / 3;
                const cy = (vertices[0].y + vertices[1].y + vertices[2].y) / 3;
                sumX += cx;
                sumY += cy;
            });
            const centroidX = sumX / cluster.length;
            const centroidY = sumY / cluster.length;

            // Distance from mouse to centroid
            const dist = Math.sqrt((x - centroidX) ** 2 + (y - centroidY) ** 2);

            if (dist < minDist) {
                minDist = dist;
                bestAnchor = { r, c };
            }
        }
    }

    return bestAnchor;
}
