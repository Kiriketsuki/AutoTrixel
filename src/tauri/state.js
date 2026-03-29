let currentPath = null;
let dirty = false;

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
