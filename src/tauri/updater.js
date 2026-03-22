/**
 * Auto-updater integration using @tauri-apps/plugin-updater.
 *
 * NOTE: The updater requires signing keys to work. Before shipping:
 * 1. Generate keys: tauri signer generate -w ~/.tauri/autotrixel.key
 * 2. Set the public key in tauri.conf.json → plugins.updater.pubkey
 * 3. Set TAURI_SIGNING_PRIVATE_KEY env var in your CI build pipeline
 *
 * Until keys are configured, update checks will fail silently (see catch below).
 */

/**
 * Checks for an available update and, if found, downloads and installs it.
 * Intended to be called non-blocking after app startup.
 *
 * @param {function(string): void} [onStatus] - Optional callback for status messages
 * @returns {Promise<void>}
 */
export async function checkForUpdate(onStatus) {
    if (!window.__TAURI__) return;

    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();

        if (!update) return;

        onStatus?.(`Update available: v${update.version}`);

        await update.downloadAndInstall((event) => {
            if (event.event === 'Started') {
                onStatus?.(`Downloading update (${event.data.contentLength} bytes)…`);
            } else if (event.event === 'Finished') {
                onStatus?.('Update downloaded. Restarting…');
            }
        });
    } catch (err) {
        // Silently ignore — updater may not be configured yet (missing pubkey)
        console.debug('[updater] check failed:', err);
    }
}
