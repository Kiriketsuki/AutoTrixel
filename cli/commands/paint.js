import { loadState, saveState, stateToEngineConfig, engineStateToFileState } from "../state.js";
import { createEngine } from "../../src/core/engine.js";

function parseColor(colorStr) {
    const hex = colorStr.trim();
    const oklch = colorStr.trim();

    if (/^#[0-9a-fA-F]{3}$/.test(hex) || /^#[0-9a-fA-F]{6}$/.test(hex)) {
        return { type: "hex", value: hex };
    }
    if (oklch.startsWith("oklch(") && oklch.endsWith(")")) {
        return { type: "oklch", value: oklch };
    }
    return null;
}

function parseOklch(oklchStr) {
    // e.g. "oklch(60% 0.15 200)"
    const inner = oklchStr.slice(6, -1).trim();
    const parts = inner.split(/\s+/);
    if (parts.length < 3) return null;

    const lStr = parts[0];
    const c = parseFloat(parts[1]);
    const h = parseFloat(parts[2]);

    let l;
    if (lStr.endsWith("%")) {
        l = parseFloat(lStr) / 100;
    } else {
        l = parseFloat(lStr);
    }

    if (isNaN(l) || isNaN(c) || isNaN(h)) return null;
    return { l, c, h };
}

function collectCell(value, previous) {
    previous.push(value);
    return previous;
}

export function registerPaint(program) {
    program
        .command("paint")
        .description("Paint cells on a TrKixel canvas")
        .requiredOption("-i, --input <path>", "input file path")
        .option("--cell <value>", "cell to paint as r,c (repeatable)", collectCell, [])
        .requiredOption("--color <color>", "color to paint (hex or oklch string)")
        .action(async (options) => {
            const { input, cell: cellArgs, color } = options;

            if (cellArgs.length === 0) {
                process.stderr.write("Error: at least one --cell <r,c> is required\n");
                process.exit(1);
            }

            // Parse cell coordinates
            const cells = [];
            for (const cellStr of cellArgs) {
                const parts = cellStr.split(",");
                if (parts.length !== 2) {
                    process.stderr.write(`Error: invalid cell format "${cellStr}", expected r,c\n`);
                    process.exit(1);
                }
                const r = parseInt(parts[0], 10);
                const c = parseInt(parts[1], 10);
                if (isNaN(r) || isNaN(c)) {
                    process.stderr.write(`Error: invalid cell coordinates "${cellStr}"\n`);
                    process.exit(1);
                }
                cells.push({ r, c });
            }

            // Validate color format
            const parsedColor = parseColor(color);
            if (!parsedColor) {
                process.stderr.write(`Error: invalid color "${color}". Must be hex (#rgb or #rrggbb) or oklch(...)\n`);
                process.exit(1);
            }

            // Load state
            let state;
            try {
                state = await loadState(input);
            } catch (err) {
                process.stderr.write(`Error loading file: ${err.message}\n`);
                process.exit(1);
            }

            // Create engine and load grid
            const config = stateToEngineConfig(state);
            const engine = createEngine(config);
            engine.loadState({ gridData: state.gridData });

            // Validate cell bounds
            const { heightTriangles, widthTriangles } = config;
            for (const { r, c } of cells) {
                if (r < 0 || r >= heightTriangles || c < 0 || c >= widthTriangles) {
                    process.stderr.write(
                        `Error: cell (${r},${c}) is out of bounds. Canvas is ${heightTriangles} rows x ${widthTriangles} cols\n`
                    );
                    process.exit(1);
                }
            }

            // Set color on engine
            if (parsedColor.type === "hex") {
                engine.setColorFromHex(parsedColor.value);
            } else {
                const lch = parseOklch(parsedColor.value);
                if (!lch) {
                    process.stderr.write(`Error: could not parse oklch values from "${color}"\n`);
                    process.exit(1);
                }
                engine.setColor(lch.l, lch.c, lch.h);
            }

            // Paint cells
            engine.setTool("pencil");
            engine.paintCells(cells);

            // Save result
            try {
                await saveState(input, engineStateToFileState(engine, state.palette));
                process.stdout.write(`Painted ${cells.length} cell(s) in ${input}\n`);
            } catch (err) {
                process.stderr.write(`Error saving file: ${err.message}\n`);
                process.exit(1);
            }
        });
}
