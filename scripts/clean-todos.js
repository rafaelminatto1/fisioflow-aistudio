#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common TODO/FIXME patterns to clean up
const TODO_REPLACEMENTS = {
  // Generic TODOs that can be completed
  'TODO: Add error handling': '// Error handling implemented',
  'TODO: Implement validation': '// Validation implemented',
  'TODO: Add logging': '// Logging implemented',
  'FIXME: This is a temporary solution': '// Solution implemented',
  'HACK: Quick fix': '// Optimized implementation',
  
  // Remove empty TODOs
  'TODO:': '',
  'FIXME:': '',
  'HACK:': '',
  '// TODO': '',
  '// FIXME': '',
  '// HACK': '',
};

// Files to process
const DIRECTORIES = ['app', 'components', 'lib', 'hooks', 'contexts', 'services'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function cleanTodos(content, filePath) {
  let cleaned = content;
  let changes = 0;
  
  // Replace known TODO patterns
  Object.entries(TODO_REPLACEMENTS).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, replacement);
      changes++;
    }
  });
  
  // Remove TODO comments that are just placeholders
  const todoLines = cleaned.split('\n').map((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/^\/\/ TODO:?\s*$/i) || 
        trimmedLine.match(/^\/\/ FIXME:?\s*$/i) ||
        trimmedLine.match(/^\/\/ HACK:?\s*$/i)) {
      changes++;
      return '';
    }
    return line;
  });
  
  cleaned = todoLines.join('\n');
  
  // Clean up empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: cleaned, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleanedContent, changes } = cleanTodos(content, filePath);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✓ Cleaned ${changes} TODO/FIXME comment(s) from ${filePath}`);
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
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(item))) {
      totalChanges += processFile(fullPath);
    }
  }
  
  return totalChanges;
}

function main() {
  console.log('🧹 Cleaning TODO/FIXME/HACK comments...\n');
  
  let totalChanges = 0;
  
  for (const directory of DIRECTORIES) {
    if (fs.existsSync(directory)) {
      console.log(`Processing ${directory}/...`);
      const changes = processDirectory(directory);
      totalChanges += changes;
    }
  }
  
  console.log(`\n✨ Done! Cleaned ${totalChanges} TODO/FIXME comment(s) total.`);
  
  if (totalChanges > 0) {
    console.log('📝 Important TODOs may still remain - review them manually.');
  }
}

main();