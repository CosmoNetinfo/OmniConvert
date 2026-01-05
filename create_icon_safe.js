const fs = require('fs');
const sharp = require('sharp');
// Handle ESM/CommonJS for png-to-ico
let pngToIco = require('png-to-ico');
if (pngToIco.default) pngToIco = pngToIco.default;

async function createIcon() {
    console.log("Processing logo.png...");
    try {
        // 1. Ensure clean entry
        const input = 'public/logo.png';
        const tempPng = 'public/temp_logo_256.png';
        const output = 'build/icon.ico';

        // 2. Resize to standard icon size (256x256) ensuring it is a valid PNG
        await sharp(input)
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(tempPng);
        
        console.log("Resized to 256x256.");

        // 3. Convert to ICO
        const buf = await pngToIco([tempPng]);
        fs.writeFileSync(output, buf);
        console.log("Success: Icon created at " + output);

        // 4. Cleanup
        fs.unlinkSync(tempPng);

    } catch (err) {
        console.error("Icon creation failed:", err);
        process.exit(1);
    }
}

createIcon();
