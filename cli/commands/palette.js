import { readFile } from "node:fs/promises";
import { loadState, saveState } from "../state.js";
import { parseGPL } from "../../src/logic/palette-utils.js";

export function registerPalette(program) {
    program
        .command("palette")
        .description("Import a .gpl palette file into a TrKixel canvas state")
        .requiredOption("-i, --input <path>", "input file path")
        .requiredOption("--import <palettePath>", "path to .gpl palette file to import")
        .action(async (options) => {
            const { input, import: palettePath } = options;

            let paletteContent;
            try {
                paletteContent = await readFile(palettePath, "utf-8");
            } catch (err) {
                process.stderr.write(`Error: could not read palette file "${palettePath}": ${err.message}\n`);
                process.exit(1);
            }

            let state;
            try {
                state = await loadState(input);
            } catch (err) {
                process.stderr.write(`Error loading file: ${err.message}\n`);
                process.exit(1);
            }

            const colors = parseGPL(paletteContent);
            state.palette = colors;

            try {
                await saveState(input, state);
                process.stdout.write(`Imported ${colors.length} color(s) into palette in ${input}\n`);
            } catch (err) {
                process.stderr.write(`Error saving file: ${err.message}\n`);
                process.exit(1);
            }
        });
}
