const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function resolveImport(importer, importPath) {
  if (!importPath.startsWith('.')) return null; // Only check relative paths
  
  let targetPath = path.resolve(path.dirname(importer), importPath);
  
  // Try adding extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
  let foundPath = null;
  
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    foundPath = targetPath;
  } else {
    for (const ext of extensions) {
      if (fs.existsSync(targetPath + ext)) {
        foundPath = targetPath + ext;
        break;
      }
    }
  }

  if (!foundPath) return null; // Module missing, but tsc would have caught it if it was a real error, wait, let's just check standard cases

  // Now verify exact casing!
  const dirName = path.dirname(foundPath);
  const baseName = path.basename(foundPath);
  
  try {
    const files = fs.readdirSync(dirName);
    if (!files.includes(baseName)) {
      // The file was required with Wrong Casing!
      const actualName = files.find(f => f.toLowerCase() === baseName.toLowerCase());
      return { expected: actualName, used: baseName };
    }
  } catch(e) {}
  
  return null;
}

walk(path.join(__dirname, 'src'), (err, files) => {
  if (err) throw err;
  let hasErrors = false;
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Basic regex to find imports
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const caseError = resolveImport(file, importPath);
      if (caseError) {
        console.error(`CASE MISMATCH in ${path.relative(__dirname, file)}: imported '${importPath}', but actual file is '${caseError.expected}'`);
        hasErrors = true;
      }
    }
  });
  
  if (!hasErrors) {
    console.log("No case sensitivity mismatches found. Perfect for Cloudflare.");
  }
});
