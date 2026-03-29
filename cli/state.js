import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { access } from "node:fs/promises";

const STATE_VERSION = 1;

export function createState(rows, cols, triSize = 30) {
    return {
        version: STATE_VERSION,
        config: { rows, cols, triSize },
        gridData: {},
        palette: [],
    };
}

export function stateToEngineConfig(state) {
    const { rows, cols, triSize } = state.config;
    const W_half = triSize / 2;
    const triHeight = (triSize * Math.sqrt(3)) / 2;
    return {
        triSide: triSize,
        width: cols * W_half,
        height: rows * triHeight,
        widthTriangles: cols,
        heightTriangles: rows,
    };
}

function engineConfigToState(config) {
    return {
        rows: config.heightTriangles,
        cols: config.widthTriangles,
        triSize: config.triSide,
    };
}

export async function loadState(filePath) {
    let raw;
    try {
        raw = await readFile(filePath, "utf-8");
    } catch (err) {
        if (err.code === "ENOENT") {
            throw new Error(`File not found: ${filePath}`);
        }
        throw err;
    }
    const state = JSON.parse(raw);
    if (!state.version || !state.config) {
        throw new Error(`Invalid state file: ${filePath}`);
    }
    return state;
}

export async function saveState(filePath, state) {
    const dir = dirname(filePath);
    try {
        await access(dir);
    } catch {
        throw new Error(`Output directory does not exist: ${dir}`);
    }
    const output = {
        version: state.version || STATE_VERSION,
        config: state.config,
        gridData: state.gridData || {},
        palette: state.palette || [],
    };
    await writeFile(filePath, JSON.stringify(output, null, 2) + "\n", "utf-8");
}

export function engineStateToFileState(engine, palette = []) {
    const config = engine.getConfig();
    const gridData = engine.getGridData();
    return {
        version: STATE_VERSION,
        config: engineConfigToState(config),
        gridData: JSON.parse(JSON.stringify(gridData)),
        palette,
    };
}
