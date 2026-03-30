import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs';

export async function exportPNG(engine) {
    const path = await save({
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
        defaultPath: 'trkixel.png',
    });
    if (!path) return;

    const blob = await engine.exportImageAsBlob();
    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(path, new Uint8Array(arrayBuffer));
}

export async function exportSVG(engine) {
    const path = await save({
        filters: [{ name: 'SVG Image', extensions: ['svg'] }],
        defaultPath: 'trkixel.svg',
    });
    if (!path) return;

    const svgString = engine.exportSVGAsString();
    await writeTextFile(path, svgString);
}
