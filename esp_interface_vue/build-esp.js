import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');

// Statistics tracking
let statistics = {
  totalOriginal: 0,
  totalCompressed: 0,
  filesProcessed: 0,
  filesRemoved: 0
};

// Clean data directory
console.log('Cleaning old data directory...');
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true });
}
fs.mkdirSync(dataDir, { recursive: true });

// Remove malformed gzip files from dist
function cleanMalformedGzip(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      cleanMalformedGzip(filePath);
      // Remove empty directories
      try {
        if (fs.readdirSync(filePath).length === 0) {
          fs.rmdirSync(filePath);
          statistics.filesRemoved++;
        }
      } catch (e) {
        // Ignore errors
      }
    } else if (file.name.endsWith('.gz')) {
      // Remove gzip files with wrong paths
      if (filePath.includes('dist/D:') || filePath.includes('dist\\D:')) {
        console.log(`Removing malformed: ${filePath}`);
        fs.unlinkSync(filePath);
        statistics.filesRemoved++;
      }
    }
  });
}

// Validate gzip file integrity
function isValidGzip(buffer) {
  // Gzip files start with magic number 0x1f 0x8b
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

// Process and copy files
function processDirectory(sourceDir, targetDir, flatStructure = false) {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file.name);
    const relativePath = path.relative(distDir, sourcePath);
    
    // For flat structure, create shorter names
    let flatName = relativePath.replace(/[\/\\]/g, '_');
    
    // Shorten long filenames (LittleFS has 31 char limit for filenames)
    if (flatName.length > 25) {
      const ext = path.extname(flatName);
      const nameWithoutExt = flatName.slice(0, flatName.length - ext.length);
      // Keep first 10 chars + last 10 chars + extension
      flatName = nameWithoutExt.slice(0, 10) + '_' + nameWithoutExt.slice(-10) + ext;
    }
    
    const targetPath = flatStructure 
      ? path.join(targetDir, flatName)
      : path.join(targetDir, relativePath);

    if (file.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(sourcePath, targetDir, flatStructure);
    } else {
      // Skip already processed .gz files
      if (file.name.endsWith('.gz')) {
        return;
      }

      try {
        const fileContent = fs.readFileSync(sourcePath);
        const displayName = flatStructure ? flatName : relativePath;
        
        // For HTML files, copy both original and .gz
        if (file.name.endsWith('.html')) {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied: ${displayName}`);
          
          const gzipped = zlib.gzipSync(fileContent, { level: 9 });
          
          // Validate gzip
          if (!isValidGzip(gzipped)) {
            console.log(`Invalid gzip for: ${displayName}`);
            return;
          }
          
          const gzipPath = targetPath + '.gz';
          fs.writeFileSync(gzipPath, gzipped);
          
          const savings = ((1 - gzipped.length / fileContent.length) * 100).toFixed(1);
          console.log(`Gzipped: ${displayName}.gz (${fileContent.length}B → ${gzipped.length}B, ${savings}% saved)`);
          
          statistics.totalOriginal += fileContent.length;
          statistics.totalCompressed += gzipped.length;
          statistics.filesProcessed += 2;
        } 
        // For other files (JS, CSS), only create .gz version
        else {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          
          const gzipped = zlib.gzipSync(fileContent, { level: 9 });
          
          // Validate gzip
          if (!isValidGzip(gzipped)) {
            console.log(`Invalid gzip for: ${displayName}`);
            return;
          }
          
          const gzipPath = targetPath + '.gz';
          fs.writeFileSync(gzipPath, gzipped);
          
          const savings = ((1 - gzipped.length / fileContent.length) * 100).toFixed(1);
          console.log(`GZ only: ${displayName}.gz (${fileContent.length}B → ${gzipped.length}B, ${savings}% saved)`);
          
          statistics.totalOriginal += fileContent.length;
          statistics.totalCompressed += gzipped.length;
          statistics.filesProcessed++;
        }
      } catch (error) {
        console.error(`Error processing ${file.name}: ${error.message}`);
      }
    }
  });
}

// Main execution
try {
  console.log('\n Starting LittleFS build process...\n');
  
  console.log(' Cleaning malformed gzip files...');
  cleanMalformedGzip(distDir);
  
  console.log('\n Building ESP8266 data directory...');
  processDirectory(distDir, dataDir, true); // true = flat structure
  
  // Print statistics
  const totalSavings = ((1 - statistics.totalCompressed / statistics.totalOriginal) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 BUILD STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${statistics.filesProcessed}`);
  console.log(`Files removed: ${statistics.filesRemoved}`);
  console.log(`Original size: ${(statistics.totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`Compressed size: ${(statistics.totalCompressed / 1024).toFixed(2)} KB`);
  console.log(`Total savings: ${totalSavings}%`);
  console.log('='.repeat(60));
  
  console.log('\n Done! Upload "data" folder using:');
  console.log('  Arduino IDE → Tools → ESP8266 LittleFS Data Upload');
  console.log('\n Data directory created at: ' + dataDir);
  
} catch (error) {
  console.error('\n Fatal error:', error.message);
  process.exit(1);
}