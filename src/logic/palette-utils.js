/**
 * Parses a GIMP Palette (.gpl) string and returns an array of hex colors.
 * @param {string} content - The content of the .gpl file.
 * @returns {string[]} - Array of hex color strings (e.g., "#RRGGBB").
 */
export function parseGPL(content) {
    const lines = content.split(/\r?\n/);
    const colors = [];
    let headerFound = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        if (trimmed === "GIMP Palette") {
            headerFound = true;
            continue;
        }

        // Skip other header fields like Name: or Columns:
        if (trimmed.includes(":")) continue;

        // Parse color lines: R G B Name
        // Example: 255 0 0 Red
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
            const r = parseInt(parts[0], 10);
            const g = parseInt(parts[1], 10);
            const b = parseInt(parts[2], 10);

            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                const hex =
                    "#" +
                    [r, g, b]
                        .map((x) => {
                            const hex = x.toString(16);
                            return hex.length === 1 ? "0" + hex : hex;
                        })
                        .join("");
                colors.push(hex);
            }
        }
    }

    return colors;
}

/**
 * Generates a GIMP Palette (.gpl) string from an array of hex colors.
 * @param {string[]} colors - Array of hex color strings.
 * @param {string} name - The name of the palette.
 * @returns {string} - The formatted .gpl content.
 */
export function generateGPL(colors, name = "AutoTrixel Palette") {
    let content = "GIMP Palette\n";
    content += `Name: ${name}\n`;
    content += "Columns: 4\n";
    content += "#\n";

    for (const hex of colors) {
        // Convert hex to RGB
        let r = 0,
            g = 0,
            b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }

        // Pad with spaces for alignment (optional but nice)
        const rStr = r.toString().padStart(3, " ");
        const gStr = g.toString().padStart(3, " ");
        const bStr = b.toString().padStart(3, " ");

        content += `${rStr} ${gStr} ${bStr} ${hex}\n`;
    }

    return content;
}
