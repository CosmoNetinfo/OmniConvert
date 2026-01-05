const fs = require('fs');
// Handle ESM/CommonJS interop
let pngToIco = require('png-to-ico');
if (pngToIco.default) pngToIco = pngToIco.default;

console.log("Generating icon from public/logo.png...");

if (!fs.existsSync('public/logo.png')) {
    console.error("Error: public/logo.png not found!");
    process.exit(1);
}

pngToIco('public/logo.png')
  .then(buf => {
    fs.writeFileSync('public/icon.ico', buf);
    console.log('Success! Icon created at public/icon.ico');
  })
  .catch(err => {
    console.error('Error creating icon:', err);
    process.exit(1);
  });
