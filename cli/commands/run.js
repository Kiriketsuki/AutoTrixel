import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createEngine } from "../../src/core/engine.js";
import { renderPNG, renderSVG } from "../../src/core/export.js";
import { createNodeCanvasAdapter } from "../../src/core/adapters/node.js";
import { parseGPL } from "../../src/logic/palette-utils.js";
import { createState, saveState, stateToEngineConfig, engineStateToFileState } from "../state.js";

function parseColor(colorStr) {
    if (colorStr.startsWith("#")) {
        if (/^#[0-9a-fA-F]{3}$/.test(colorStr) || /^#[0-9a-fA-F]{6}$/.test(colorStr)) {
            return { type: "hex", value: colorStr };
        }
    }
    const m = colorStr.match(/^oklch\(\s*([\d.]+(%)?)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
    if (m) {
        let l = parseFloat(m[1]);
        if (m[2] === "%") l = l / 100;
        return { type: "oklch", l, c: parseFloat(m[3]), h: parseFloat(m[4]) };
    }
    return null;
}

function applyColor(engine, parsed) {
    if (parsed.type === "hex") engine.setColorFromHex(parsed.value);
    else engine.setColor(parsed.l, parsed.c, parsed.h);
}

function parseCell(cellStr) {
    const parts = cellStr.split(",");
    if (parts.length !== 2) return null;
    const r = parseInt(parts[0], 10);
    const c = parseInt(parts[1], 10);
    if (isNaN(r) || isNaN(c)) return null;
    return { r, c };
}

function validateCellBounds(cell, canvasConfig, opIndex, opType) {
    const { heightTriangles, widthTriangles } = canvasConfig;
    if (cell.r < 0 || cell.r >= heightTriangles || cell.c < 0 || cell.c >= widthTriangles) {
        process.stderr.write(
            `Error: operation ${opIndex} (${opType}) cell (${cell.r},${cell.c}) out of bounds (grid is ${heightTriangles}x${widthTriangles})\n`
        );
        process.exit(1);
    }
}

export function registerRun(program) {
    program
        .command("run")
        .description("Execute a batch of operations from a JSON instructions file")
        .argument("<instructions>", "path to JSON instructions file")
        .requiredOption("-o, --output <path>", "output file path for final state")
        .action(async (instructionsPath, options) => {
            const { output } = options;

            let instructions;
            try {
                const raw = await readFile(instructionsPath, "utf-8");
                instructions = JSON.parse(raw);
            } catch (err) {
                process.stderr.write(`Error: could not read or parse instructions file: ${err.message}\n`);
                process.exit(1);
            }

            if (!Array.isArray(instructions)) {
                process.stderr.write("Error: instructions file must be a JSON array\n");
                process.exit(1);
            }

            let engine = null;
            let canvasConfig = null;
            let palette = [];

            for (let i = 0; i < instructions.length; i++) {
                const op = instructions[i];
                if (op === null || op === undefined || typeof op !== "object") {
                    process.stderr.write(`Error: operation ${i} is not a valid object\n`);
                    process.exit(1);
                }

                switch (op.op) {
                    case "create": {
                        const { rows, cols, triSize } = op;
                        const numRows = Number(rows);
                        const numCols = Number(cols);
                        const numTriSize = Number(triSize || 30);
                        if (isNaN(numRows) || numRows <= 0) {
                            process.stderr.write(`Error: operation ${i} (create) requires a positive "rows" value\n`);
                            process.exit(1);
                        }
                        if (isNaN(numCols) || numCols <= 0) {
                            process.stderr.write(`Error: operation ${i} (create) requires a positive "cols" value\n`);
                            process.exit(1);
                        }
                        if (isNaN(numTriSize) || numTriSize <= 0) {
                            process.stderr.write(`Error: operation ${i} (create) requires a positive "triSize" value\n`);
                            process.exit(1);
                        }
                        const state = createState(numRows, numCols, numTriSize);
                        const config = stateToEngineConfig(state);
                        engine = createEngine(config);
                        canvasConfig = engine.getConfig();
                        break;
                    }

                    case "paint": {
                        if (!engine) {
                            process.stderr.write(`Error: operation ${i} (paint) requires a "create" op first\n`);
                            process.exit(1);
                        }
                        if (!op.cell || typeof op.cell !== "string") {
                            process.stderr.write(`Error: operation ${i} (paint) requires a "cell" value\n`);
                            process.exit(1);
                        }
                        if (!op.color || typeof op.color !== "string") {
                            process.stderr.write(`Error: operation ${i} (paint) requires a "color" value\n`);
                            process.exit(1);
                        }
                        const cell = parseCell(op.cell);
                        if (!cell) {
                            process.stderr.write(`Error: operation ${i} (paint) has invalid cell "${op.cell}"\n`);
                            process.exit(1);
                        }
                        const parsed = parseColor(op.color);
                        if (!parsed) {
                            process.stderr.write(`Error: operation ${i} (paint) has invalid color "${op.color}"\n`);
                            process.exit(1);
                        }
                        validateCellBounds(cell, canvasConfig, i, "paint");
                        applyColor(engine, parsed);
                        engine.setTool("pencil");
                        engine.paintCells([cell]);
                        break;
                    }

                    case "fill": {
                        if (!engine) {
                            process.stderr.write(`Error: operation ${i} (fill) requires a "create" op first\n`);
                            process.exit(1);
                        }
                        if (!op.cell || typeof op.cell !== "string") {
                            process.stderr.write(`Error: operation ${i} (fill) requires a "cell" value\n`);
                            process.exit(1);
                        }
                        if (!op.color || typeof op.color !== "string") {
                            process.stderr.write(`Error: operation ${i} (fill) requires a "color" value\n`);
                            process.exit(1);
                        }
                        const cell = parseCell(op.cell);
                        if (!cell) {
                            process.stderr.write(`Error: operation ${i} (fill) has invalid cell "${op.cell}"\n`);
                            process.exit(1);
                        }
                        const parsed = parseColor(op.color);
                        if (!parsed) {
                            process.stderr.write(`Error: operation ${i} (fill) has invalid color "${op.color}"\n`);
                            process.exit(1);
                        }
                        validateCellBounds(cell, canvasConfig, i, "fill");
                        applyColor(engine, parsed);
                        engine.fillAtCell(cell.r, cell.c);
                        break;
                    }

                    case "export": {
                        if (!engine) {
                            process.stderr.write(`Error: operation ${i} (export) requires a "create" op first\n`);
                            process.exit(1);
                        }
                        const { format, output: exportOutput } = op;
                        if (!exportOutput || typeof exportOutput !== "string") {
                            process.stderr.write(`Error: operation ${i} (export) requires an "output" value\n`);
                            process.exit(1);
                        }
                        if (!format || typeof format !== "string") {
                            process.stderr.write(`Error: operation ${i} (export) requires a "format" value\n`);
                            process.exit(1);
                        }
                        if (format !== "svg" && format !== "png") {
                            process.stderr.write(`Error: operation ${i} (export) has unsupported format "${format}"\n`);
                            process.exit(1);
                        }
                        try {
                            await mkdir(dirname(exportOutput), { recursive: true });
                            if (format === "svg") {
                                const svg = renderSVG(engine);
                                await writeFile(exportOutput, svg, "utf-8");
                            } else {
                                let adapter;
                                try {
                                    adapter = await createNodeCanvasAdapter();
                                } catch (err) {
                                    process.stderr.write(`${err.message}\n`);
                                    process.exit(1);
                                }
                                const buf = await renderPNG(engine, adapter);
                                await writeFile(exportOutput, buf);
                            }
                            process.stdout.write(`Exported ${format.toUpperCase()} to ${exportOutput}\n`);
                        } catch (err) {
                            process.stderr.write(`Error: export failed: ${err.message}\n`);
                            process.exit(1);
                        }
                        break;
                    }

                    case "palette": {
                        if (!op.import || typeof op.import !== "string") {
                            process.stderr.write(`Error: operation ${i} (palette) requires an "import" field with a file path\n`);
                            process.exit(1);
                        }
                        let gplContent;
                        try {
                            gplContent = await readFile(op.import, "utf-8");
                        } catch (err) {
                            process.stderr.write(`Error: operation ${i} (palette) could not read "${op.import}": ${err.message}\n`);
                            process.exit(1);
                        }
                        palette = parseGPL(gplContent);
                        break;
                    }

                    default:
                        process.stderr.write(`Error: unknown operation: ${op.op}\n`);
                        process.exit(1);
                }
            }

            if (!engine) {
                process.stderr.write("Error: no \"create\" operation found — cannot save final state\n");
                process.exit(1);
            }

            try {
                await mkdir(dirname(output), { recursive: true });
                await saveState(output, engineStateToFileState(engine, palette));
                process.stdout.write(`Saved final state to ${output}\n`);
            } catch (err) {
                process.stderr.write(`Error saving output: ${err.message}\n`);
                process.exit(1);
            }
        });
}
