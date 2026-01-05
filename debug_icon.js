const pkg = require('png-to-ico');
console.log('Type:', typeof pkg);
console.log('Keys:', Object.keys(pkg));
if (typeof pkg !== 'function') {
  if (pkg.default) console.log('Has default export');
}
