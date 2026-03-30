/**
 * Translates file-format config {rows, cols, triSize} to engine-format config
 * {triSide, width, height, widthTriangles, heightTriangles}.
 * @param {{ config: { rows: number, cols: number, triSize: number } }} state
 * @returns {{ triSide: number, width: number, height: number, widthTriangles: number, heightTriangles: number }}
 */
export function stateToEngineConfig(state) {
    const { rows, cols, triSize } = state.config;
    const W_half = triSize / 2;
    const triHeight = (triSize * Math.sqrt(3)) / 2;
    return {
        triSide: triSize,
        width: cols * W_half,
        height: rows * triHeight,
        widthTriangles: cols,
        heightTriangles: rows,
    };
}

/**
 * Translates engine-format config back to file-format config.
 * @param {{ heightTriangles: number, widthTriangles: number, triSide: number }} config
 * @returns {{ rows: number, cols: number, triSize: number }}
 */
export function engineConfigToState(config) {
    return {
        rows: config.heightTriangles,
        cols: config.widthTriangles,
        triSize: config.triSide,
    };
}

/**
 * Returns true if the config object is in CLI/file format (has `rows` key)
 * rather than engine format (has `triSide` key).
 * @param {object} config
 * @returns {boolean}
 */
export function isFileFormatConfig(config) {
    return config != null && 'rows' in config && !('triSide' in config);
}
