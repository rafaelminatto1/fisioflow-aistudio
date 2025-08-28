#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to match console statements that should be removed
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?/g,
  /console\.debug\([^)]*\);?/g,
  /console\.info\([^)]*\);?/g,
  // Keep console.warn and console.error as they're important for debugging
];

// Directories to process
const DIRECTORIES = [
  'app',
  'src', 
  'components',
  'lib',
  'hooks',
  'contexts',
  'services'
];

// Files to skip (these might legitimately need console statements)
const SKIP_FILES = [
  'logger.ts',
  'logger.js',
  'edge-logger.ts',
  'simple-logger.ts',
  'railway-logger.ts'
];

// Extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function shouldSkipFile(filePath) {
  const fileName = path.basename(filePath);
  return SKIP_FILES.some(skipFile => fileName.includes(skipFile)) ||
         filePath.includes('test') ||
         filePath.includes('spec') ||
         filePath.includes('.test.') ||
         filePath.includes('.spec.');
}

function cleanConsoleStatements(content) {
  let cleaned = content;
  let changes = 0;
  
  CONSOLE_PATTERNS.forEach(pattern => {
    const matches = cleaned.match(pattern);
    if (matches) {
      changes += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  });
  
  // Clean up empty lines left behind
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: cleaned, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleanedContent, changes } = cleanConsoleStatements(content);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✓ Cleaned ${changes} console statement(s) from ${filePath}`);
      return changes;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return 0;
}

function processDirectory(dirPath) {
  let totalChanges = 0;
  
  if (!fs.existsSync(dirPath)) {
    return totalChanges;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalChanges += processDirectory(fullPath);
    } else if (stat.isFile() && 
               EXTENSIONS.includes(path.extname(item)) && 
               !shouldSkipFile(fullPath)) {
      totalChanges += processFile(fullPath);
    }
  }
  
  return totalChanges;
}

function main() {
  console.log('🧹 Cleaning console.log statements from production code...\n');
  
  let totalChanges = 0;
  
  for (const directory of DIRECTORIES) {
    if (fs.existsSync(directory)) {
      console.log(`Processing ${directory}/...`);
      const changes = processDirectory(directory);
      totalChanges += changes;
    }
  }
  
  console.log(`\n✨ Done! Cleaned ${totalChanges} console statement(s) total.`);
  
  if (totalChanges > 0) {
    console.log('\n📝 Note: console.warn and console.error were preserved for debugging.');
    console.log('🧪 Run tests to ensure everything still works correctly.');
  }
}

main();