import { createEngine } from "../../src/core/engine.js";
import { loadState, saveState, stateToEngineConfig, engineStateToFileState } from "../state.js";

function parseOklch(colorStr) {
    // "oklch(60% 0.15 200)" or "oklch(0.6 0.15 200)"
    const inner = colorStr.slice("oklch(".length, -1).trim();
    const parts = inner.split(/\s+/);
    if (parts.length < 3) return null;
    let l = parseFloat(parts[0]);
    if (parts[0].endsWith("%")) l = l / 100;
    const c = parseFloat(parts[1]);
    const h = parseFloat(parts[2]);
    if (isNaN(l) || isNaN(c) || isNaN(h)) return null;
    return { l, c, h };
}

export function registerFill(program) {
    program
        .command("fill")
        .description("Flood fill a cell on a TrKixel canvas")
        .requiredOption("-i, --input <path>", "input file path")
        .requiredOption("--cell <r,c>", "cell to fill as row,col (e.g. 2,3)")
        .requiredOption("--color <color>", "fill color as hex or oklch")
        .action(async (options) => {
            const { input, cell, color } = options;

            // Parse cell
            const cellParts = cell.split(",");
            if (cellParts.length !== 2) {
                process.stderr.write("Error: --cell must be in format r,c (e.g. 2,3)\n");
                process.exit(1);
            }
            const r = parseInt(cellParts[0], 10);
            const c = parseInt(cellParts[1], 10);
            if (isNaN(r) || isNaN(c)) {
                process.stderr.write("Error: --cell values must be integers\n");
                process.exit(1);
            }

            // Validate color format
            const hexRe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
            const isHex = hexRe.test(color);
            const isOklch = color.startsWith("oklch(");
            if (!isHex && !isOklch) {
                process.stderr.write(`Error: invalid color "${color}" — must be hex (#rgb or #rrggbb) or oklch(...)\n`);
                process.exit(1);
            }

            try {
                const state = await loadState(input);
                const engineConfig = stateToEngineConfig(state);
                const engine = createEngine(engineConfig);
                engine.loadState({ gridData: state.gridData });

                const config = engine.getConfig();

                // Validate cell bounds
                if (r < 0 || r >= config.heightTriangles || c < 0 || c >= config.widthTriangles) {
                    process.stderr.write(
                        `Error: cell (${r},${c}) out of bounds (grid is ${config.heightTriangles}x${config.widthTriangles})\n`
                    );
                    process.exit(1);
                }

                // Set color on engine
                if (isHex) {
                    engine.setColorFromHex(color);
                } else {
                    const parsed = parseOklch(color);
                    if (!parsed) {
                        process.stderr.write(`Error: could not parse oklch color "${color}"\n`);
                        process.exit(1);
                    }
                    engine.setColor(parsed.l, parsed.c, parsed.h);
                }

                engine.setTool("pencil");
                engine.fillAtCell(r, c);

                await saveState(input, engineStateToFileState(engine, state.palette));
                process.stdout.write(`Filled cell (${r},${c}) with ${color} in ${input}\n`);
            } catch (err) {
                process.stderr.write(`Error: ${err.message}\n`);
                process.exit(1);
            }
        });
}
