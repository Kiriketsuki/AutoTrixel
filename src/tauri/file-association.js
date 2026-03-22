/**
 * Handle .trixel.json file association launch args.
 *
 * When a .trixel.json file is double-clicked in the OS file manager, the OS
 * passes the file path as a CLI argument to AutoTrixel. This module reads
 * that argument so App.vue can load the file via engine.loadState().
 *
 * File association registration is configured in tauri.conf.json under
 * bundle.fileAssociations — registration happens at install time.
 *
 * TODO: To fully implement arg reading, add tauri-plugin-cli:
 *   1. Cargo.toml:  tauri-plugin-cli = "2"
 *   2. lib.rs:      .plugin(tauri_plugin_cli::init())
 *   3. package.json: "@tauri-apps/plugin-cli": "^2"
 *   4. capabilities/default.json: "cli:default"
 *   5. Replace the stub body below with:
 *        import { getMatches } from '@tauri-apps/plugin-cli';
 *        const matches = await getMatches();
 *        const args = matches.args?.['_']?.value;
 *        return Array.isArray(args) && args.length > 0 ? args[0] : null;
 */

/**
 * Returns the file path passed as a launch argument, or null if not in a
 * Tauri context or no file argument was provided.
 *
 * @returns {Promise<string|null>}
 */
export async function getLaunchFilePath() {
    if (!window.__TAURI__) return null;

    // Stub — requires tauri-plugin-cli (see TODO above).
    return null;
}
