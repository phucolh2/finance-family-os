const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts')) {
    const content = fs.readFileSync(f, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const impPath = match[1];
      if (impPath.startsWith('.')) {
        const resolved = path.resolve(path.dirname(f), impPath);
        const dir = path.dirname(resolved);
        if (fs.existsSync(dir)) {
          const basename = path.basename(resolved);
          const dirFiles = fs.readdirSync(dir);
          let found = false;
          for (const ext of ['', '.tsx', '.ts', '.css', '/index.ts', '/index.tsx']) {
            if (dirFiles.includes(basename + ext)) {
              found = true;
              break;
            }
          }
          if (!found) {
             const lowerFiles = dirFiles.map(d => d.toLowerCase());
             if (lowerFiles.includes(basename.toLowerCase()) || lowerFiles.includes((basename + '.tsx').toLowerCase()) || lowerFiles.includes((basename + '.ts').toLowerCase())) {
                console.log('Case mismatch in ' + f + ': ' + impPath);
             }
          }
        }
      }
    }
  }
});
console.log('Done checking case sensitivity.');
