import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your big JSON file
const dbPath = path.join(__dirname, '..', 'WordpressDB', 'wordpress_db.json');
const outputDir = path.join(__dirname, '..', 'WordpressDB', 'split');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

console.log('Reading big JSON file...');
const raw = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(raw);

let currentTable = null;
let currentRows = [];

data.forEach(entry => {
  if (entry.type === 'table') {
    // Save previous table if exists
    if (currentTable && currentRows.length) {
      const outPath = path.join(outputDir, `${currentTable}.json`);
      fs.writeFileSync(outPath, JSON.stringify(currentRows, null, 2));
      console.log(`Exported ${currentTable} (${currentRows.length} rows)`);
    }
    // Start new table
    currentTable = entry.name;
    currentRows = entry.data || [];
  }
});

// Save the last table
if (currentTable && currentRows.length) {
  const outPath = path.join(outputDir, `${currentTable}.json`);
  fs.writeFileSync(outPath, JSON.stringify(currentRows, null, 2));
  console.log(`Exported ${currentTable} (${currentRows.length} rows)`);
}

console.log('Done! All tables are now split into separate JSON files in /split.');