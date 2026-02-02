import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');

// Fix HTML references to use flat structure
function fixHtmlReferences() {
  const htmlFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(dataDir, htmlFile);
    let content = fs.readFileSync(htmlPath, 'utf-8');
    
    // Replace /assets/filename with /assets_filename
    content = content.replace(/\/assets\//g, '/assets_');
    
    fs.writeFileSync(htmlPath, content);
    console.log(`Fixed references in: ${htmlFile}`);
  });
}

fixHtmlReferences();
console.log('HTML references updated for flat structure');