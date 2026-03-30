import { writeFile } from "node:fs/promises";
import { createEngine } from "../../src/core/engine.js";
import { renderPNG, renderSVG } from "../../src/core/export.js";
import { createNodeCanvasAdapter } from "../../src/core/adapters/node.js";
import { loadState, stateToEngineConfig } from "../state.js";

export function registerExport(program) {
    program
        .command("export")
        .description("Export a TrKixel canvas to PNG or SVG")
        .requiredOption("-i, --input <path>", "input file path")
        .requiredOption("-o, --output <path>", "output file path")
        .requiredOption("--format <format>", "output format: png or svg")
        .action(async (options) => {
            const { input, output, format } = options;

            if (format !== "png" && format !== "svg") {
                process.stderr.write(`Error: unsupported format: ${format}\n`);
                process.exit(1);
            }

            try {
                const state = await loadState(input);
                const engineConfig = stateToEngineConfig(state);
                const engine = createEngine(engineConfig);
                engine.loadState({ gridData: state.gridData });

                if (format === "svg") {
                    const svg = renderSVG(engine);
                    await writeFile(output, svg, "utf-8");
                } else {
                    let adapter;
                    try {
                        adapter = await createNodeCanvasAdapter();
                    } catch (err) {
                        process.stderr.write(`${err.message}\n`);
                        process.exit(1);
                    }
                    const buf = await renderPNG(engine, adapter);
                    await writeFile(output, buf);
                }

                process.stdout.write(`Exported ${format.toUpperCase()} to ${output}\n`);
            } catch (err) {
                process.stderr.write(`Error: ${err.message}\n`);
                process.exit(1);
            }
        });
}
