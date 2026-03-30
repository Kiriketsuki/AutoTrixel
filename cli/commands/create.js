import { createState, saveState } from "../state.js";

export function registerCreate(program) {
    program
        .command("create")
        .description("Create a new TrKixel canvas file")
        .requiredOption("--rows <n>", "number of rows", (v) => parseInt(v, 10))
        .requiredOption("--cols <n>", "number of columns", (v) => parseInt(v, 10))
        .option("--tri-size <n>", "triangle side size in pixels", (v) => parseInt(v, 10), 30)
        .requiredOption("-o, --output <path>", "output file path")
        .action(async (options) => {
            const { rows, cols, triSize, output } = options;

            if (isNaN(rows) || rows <= 0) {
                process.stderr.write("Error: --rows must be a positive integer\n");
                process.exit(1);
            }
            if (isNaN(cols) || cols <= 0) {
                process.stderr.write("Error: --cols must be a positive integer\n");
                process.exit(1);
            }
            if (isNaN(triSize) || triSize <= 0) {
                process.stderr.write("Error: --tri-size must be a positive integer\n");
                process.exit(1);
            }

            try {
                const state = createState(rows, cols, triSize);
                await saveState(output, state);
                process.stdout.write(`Created ${rows}x${cols} canvas at ${output}\n`);
            } catch (err) {
                process.stderr.write(`Error: ${err.message}\n`);
                process.exit(1);
            }
        });
}
