import { readFile, writeFile } from "node:fs/promises";
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
            let palette = [];

            for (let i = 0; i < instructions.length; i++) {
                const op = instructions[i];

                switch (op.op) {
                    case "create": {
                        const { rows, cols, triSize } = op;
                        const state = createState(rows, cols, triSize || 30);
                        const config = stateToEngineConfig(state);
                        engine = createEngine(config);
                        break;
                    }

                    case "paint": {
                        if (!engine) {
                            process.stderr.write(`Error: operation ${i} (paint) requires a "create" op first\n`);
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
                        if (format !== "svg" && format !== "png") {
                            process.stderr.write(`Error: operation ${i} (export) has unsupported format "${format}"\n`);
                            process.exit(1);
                        }
                        try {
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
                await saveState(output, engineStateToFileState(engine, palette));
                process.stdout.write(`Saved final state to ${output}\n`);
            } catch (err) {
                process.stderr.write(`Error saving output: ${err.message}\n`);
                process.exit(1);
            }
        });
}
