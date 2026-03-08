const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const nextDir = '.next';
const standaloneDir = '.next/standalone';

if (fs.existsSync(nextDir) && fs.existsSync(standaloneDir)) {
  const staticDir = path.join(nextDir, 'static');
  const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
  
  if (fs.existsSync(staticDir)) {
    copyDir(staticDir, standaloneStaticDir);
    console.log('Copied .next/static to .next/standalone/.next/');
  }
  
  const publicDir = 'public';
  const standalonePublicDir = path.join(standaloneDir, 'public');
  
  if (fs.existsSync(publicDir)) {
    copyDir(publicDir, standalonePublicDir);
    console.log('Copied public to .next/standalone/');
  }
  
  console.log('Build post-processing complete!');
} else {
  console.log('Next.js build directories not found, skipping post-processing');
}
