let currentPath = null;
let dirty = false;
let currentPalette = [];

export function getCurrentPath() {
    return currentPath;
}

export function setCurrentPath(path) {
    currentPath = path;
}

export function isDirty() {
    return dirty;
}

export function markDirty() {
    dirty = true;
}

export function markClean() {
    dirty = false;
}

export function getPalette() {
    return currentPalette;
}

export function setPalette(palette) {
    currentPalette = Array.isArray(palette) ? palette : [];
}
