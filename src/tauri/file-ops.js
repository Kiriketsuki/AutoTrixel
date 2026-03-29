import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { getCurrentPath, setCurrentPath, markClean, getPalette, setPalette } from './state.js';

export async function openFile(engine) {
    const path = await open({
        filters: [{ name: 'TrKixel Canvas', extensions: ['json'] }],
        multiple: false,
    });
    if (!path) return;

    const content = await readTextFile(path);
    const state = JSON.parse(content);
    engine.loadState(state);
    setPalette(state.palette);
    setCurrentPath(path);
    markClean();
}

export async function saveFile(engine) {
    const path = getCurrentPath();
    if (!path) {
        return saveFileAs(engine);
    }
    const state = engine.getState();
    state.palette = getPalette();
    await writeTextFile(path, JSON.stringify(state, null, 2));
    markClean();
}

export async function saveFileAs(engine) {
    const path = await save({
        filters: [{ name: 'TrKixel Canvas', extensions: ['json'] }],
        defaultPath: 'untitled.trkixel.json',
    });
    if (!path) return;

    const state = engine.getState();
    state.palette = getPalette();
    await writeTextFile(path, JSON.stringify(state, null, 2));
    setCurrentPath(path);
    markClean();
}
