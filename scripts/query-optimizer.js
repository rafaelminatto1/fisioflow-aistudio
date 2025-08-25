#!/usr/bin/env node

/**
 * FisioFlow Query Optimizer
 * Analyzes and optimizes database queries for better performance
 * 
 * Usage:
 *   npm run query:analyze     - Analyze current queries
 *   npm run query:optimize    - Suggest optimizations
 *   npm run query:monitor     - Monitor query performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to scan for queries
  scanDirs: [
    'app/api',
    'lib',
    'components',
    'hooks',
    'utils'
  ],
  
  // File extensions to analyze
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Query patterns to detect
  queryPatterns: [
    /prisma\.[a-zA-Z]+\.(findMany|findFirst|findUnique|create|update|delete|upsert|count|aggregate)/g,
    /\$queryRaw`[^`]+`/g,
    /\$executeRaw`[^`]+`/g
  ],
  
  // Performance thresholds (ms)
  thresholds: {
    slow: 100,
    verySlow: 500,
    critical: 1000
  },
  
  // Output files
  outputDir: 'reports',
  reportFile: 'query-analysis-report.json',
  optimizationFile: 'query-optimizations.md'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

/**
 * Colored console logging
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Scan files for database queries
 */
function scanForQueries() {
  log('🔍 Scanning for database queries...', 'cyan');
  
  const queries = [];
  const rootDir = process.cwd();
  
  function scanDirectory(dir) {
    const fullPath = path.join(rootDir, dir);
    
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  Directory not found: ${dir}`, 'yellow');
      return;
    }
    
    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(fullPath, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(path.join(dir, file.name));
      } else if (CONFIG.extensions.some(ext => file.name.endsWith(ext))) {
        analyzeFile(filePath, dir, file.name, queries);
      }
    }
  }
  
  CONFIG.scanDirs.forEach(scanDirectory);
  
  log(`✅ Found ${queries.length} database queries`, 'green');
  return queries;
}

/**
 * Analyze a single file for queries
 */
function analyzeFile(filePath, dir, fileName, queries) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.join(dir, fileName);
    
    CONFIG.queryPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        queries.push({
          file: relativePath,
          line: lineNumber,
          query: match[0],
          type: detectQueryType(match[0]),
          complexity: analyzeComplexity(match[0]),
          suggestions: generateSuggestions(match[0])
        });
      }
    });
  } catch (error) {
    log(`❌ Error analyzing file ${filePath}: ${error.message}`, 'red');
  }
}

/**
 * Detect query type
 */
function detectQueryType(query) {
  if (query.includes('findMany')) return 'SELECT_MULTIPLE';
  if (query.includes('findFirst') || query.includes('findUnique')) return 'SELECT_SINGLE';
  if (query.includes('create')) return 'INSERT';
  if (query.includes('update')) return 'UPDATE';
  if (query.includes('delete')) return 'DELETE';
  if (query.includes('upsert')) return 'UPSERT';
  if (query.includes('count')) return 'COUNT';
  if (query.includes('aggregate')) return 'AGGREGATE';
  if (query.includes('$queryRaw') || query.includes('$executeRaw')) return 'RAW_SQL';
  return 'UNKNOWN';
}

/**
 * Analyze query complexity
 */
function analyzeComplexity(query) {
  let score = 0;
  
  // Base complexity
  score += 1;
  
  // Include relations
  if (query.includes('include:')) score += 2;
  
  // Where conditions
  const whereMatches = query.match(/where:/g);
  if (whereMatches) score += whereMatches.length;
  
  // OrderBy
  if (query.includes('orderBy:')) score += 1;
  
  // Take/Skip (pagination)
  if (query.includes('take:') || query.includes('skip:')) score += 1;
  
  // Nested queries
  const nestedMatches = query.match(/\{[^}]*\{/g);
  if (nestedMatches) score += nestedMatches.length * 2;
  
  // Raw SQL
  if (query.includes('$queryRaw') || query.includes('$executeRaw')) score += 3;
  
  if (score <= 3) return 'LOW';
  if (score <= 6) return 'MEDIUM';
  if (score <= 10) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Generate optimization suggestions
 */
function generateSuggestions(query) {
  const suggestions = [];
  
  // Missing select optimization
  if (query.includes('findMany') && !query.includes('select:')) {
    suggestions.push({
      type: 'SELECT_OPTIMIZATION',
      message: 'Consider using select to fetch only needed fields',
      impact: 'MEDIUM',
      example: 'Add select: { id: true, name: true } to reduce data transfer'
    });
  }
  
  // Missing pagination
  if (query.includes('findMany') && !query.includes('take:')) {
    suggestions.push({
      type: 'PAGINATION',
      message: 'Consider adding pagination to prevent large result sets',
      impact: 'HIGH',
      example: 'Add take: 50 and skip: offset for pagination'
    });
  }
  
  // N+1 query potential
  if (query.includes('include:')) {
    suggestions.push({
      type: 'N_PLUS_ONE',
      message: 'Check for N+1 query issues with includes',
      impact: 'HIGH',
      example: 'Consider using select with nested selects instead of include'
    });
  }
  
  // Missing indexes
  if (query.includes('where:')) {
    suggestions.push({
      type: 'INDEX_OPTIMIZATION',
      message: 'Ensure indexes exist for where conditions',
      impact: 'HIGH',
      example: 'Check if database indexes cover the where clause fields'
    });
  }
  
  // Raw SQL optimization
  if (query.includes('$queryRaw') || query.includes('$executeRaw')) {
    suggestions.push({
      type: 'RAW_SQL_REVIEW',
      message: 'Review raw SQL for optimization opportunities',
      impact: 'MEDIUM',
      example: 'Consider using Prisma methods or optimize the raw SQL'
    });
  }
  
  return suggestions;
}

/**
 * Generate optimization report
 */
function generateReport(queries) {
  log('📊 Generating optimization report...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalQueries: queries.length,
      byType: {},
      byComplexity: {},
      totalSuggestions: 0
    },
    queries: queries,
    recommendations: []
  };
  
  // Aggregate statistics
  queries.forEach(query => {
    // By type
    report.summary.byType[query.type] = (report.summary.byType[query.type] || 0) + 1;
    
    // By complexity
    report.summary.byComplexity[query.complexity] = (report.summary.byComplexity[query.complexity] || 0) + 1;
    
    // Count suggestions
    report.summary.totalSuggestions += query.suggestions.length;
  });
  
  // Generate recommendations
  report.recommendations = generateRecommendations(queries);
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), CONFIG.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON report
  const reportPath = path.join(outputDir, CONFIG.reportFile);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Write Markdown report
  const markdownPath = path.join(outputDir, CONFIG.optimizationFile);
  fs.writeFileSync(markdownPath, generateMarkdownReport(report));
  
  log(`✅ Reports generated:`, 'green');
  log(`   📄 JSON: ${reportPath}`, 'white');
  log(`   📝 Markdown: ${markdownPath}`, 'white');
  
  return report;
}

/**
 * Generate high-level recommendations
 */
function generateRecommendations(queries) {
  const recommendations = [];
  
  // High complexity queries
  const highComplexityQueries = queries.filter(q => 
    q.complexity === 'HIGH' || q.complexity === 'VERY_HIGH'
  );
  
  if (highComplexityQueries.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'COMPLEXITY',
      title: 'Review High Complexity Queries',
      description: `Found ${highComplexityQueries.length} high complexity queries that may impact performance`,
      action: 'Review and optimize these queries by simplifying conditions, reducing includes, or splitting into multiple queries'
    });
  }
  
  // Missing pagination
  const unpaginatedQueries = queries.filter(q => 
    q.type === 'SELECT_MULTIPLE' && 
    q.suggestions.some(s => s.type === 'PAGINATION')
  );
  
  if (unpaginatedQueries.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'PAGINATION',
      title: 'Add Pagination to findMany Queries',
      description: `Found ${unpaginatedQueries.length} queries without pagination`,
      action: 'Add take and skip parameters to prevent large result sets'
    });
  }
  
  // Potential N+1 issues
  const includeQueries = queries.filter(q => 
    q.suggestions.some(s => s.type === 'N_PLUS_ONE')
  );
  
  if (includeQueries.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'N_PLUS_ONE',
      title: 'Review Include Statements for N+1 Issues',
      description: `Found ${includeQueries.length} queries with include statements`,
      action: 'Consider using select with nested selects or batch queries to avoid N+1 issues'
    });
  }
  
  return recommendations;
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report) {
  let markdown = `# FisioFlow Query Optimization Report\n\n`;
  markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Queries:** ${report.summary.totalQueries}\n`;
  markdown += `- **Total Suggestions:** ${report.summary.totalSuggestions}\n\n`;
  
  // By Type
  markdown += `### Queries by Type\n\n`;
  Object.entries(report.summary.byType).forEach(([type, count]) => {
    markdown += `- **${type}:** ${count}\n`;
  });
  markdown += `\n`;
  
  // By Complexity
  markdown += `### Queries by Complexity\n\n`;
  Object.entries(report.summary.byComplexity).forEach(([complexity, count]) => {
    markdown += `- **${complexity}:** ${count}\n`;
  });
  markdown += `\n`;
  
  // Recommendations
  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      markdown += `### ${index + 1}. ${rec.title} (${rec.priority} Priority)\n\n`;
      markdown += `**Category:** ${rec.category}\n\n`;
      markdown += `**Description:** ${rec.description}\n\n`;
      markdown += `**Action:** ${rec.action}\n\n`;
    });
  }
  
  // Detailed Query Analysis
  markdown += `## Detailed Query Analysis\n\n`;
  report.queries.forEach((query, index) => {
    markdown += `### Query ${index + 1}\n\n`;
    markdown += `**File:** \`${query.file}:${query.line}\`\n`;
    markdown += `**Type:** ${query.type}\n`;
    markdown += `**Complexity:** ${query.complexity}\n\n`;
    markdown += `\`\`\`typescript\n${query.query}\n\`\`\`\n\n`;
    
    if (query.suggestions.length > 0) {
      markdown += `**Suggestions:**\n\n`;
      query.suggestions.forEach(suggestion => {
        markdown += `- **${suggestion.type}** (${suggestion.impact} impact): ${suggestion.message}\n`;
        if (suggestion.example) {
          markdown += `  - Example: ${suggestion.example}\n`;
        }
      });
      markdown += `\n`;
    }
  });
  
  return markdown;
}

/**
 * Monitor query performance using database statistics
 */
async function monitorPerformance() {
  log('📈 Monitoring query performance...', 'cyan');
  
  try {
    // This would require a database connection
    // For now, we'll create a placeholder for the monitoring logic
    log('⚠️  Performance monitoring requires database connection', 'yellow');
    log('💡 To enable monitoring:', 'blue');
    log('   1. Ensure pg_stat_statements extension is enabled', 'white');
    log('   2. Configure DATABASE_URL environment variable', 'white');
    log('   3. Run: npm run query:monitor', 'white');
    
    // TODO: Implement actual performance monitoring
    // This would connect to the database and query pg_stat_statements
    
  } catch (error) {
    log(`❌ Error monitoring performance: ${error.message}`, 'red');
  }
}

/**
 * Main execution function
 */
async function main() {
  const command = process.argv[2] || 'analyze';
  
  log(`🚀 FisioFlow Query Optimizer - ${command.toUpperCase()}`, 'bold');
  log('=' .repeat(50), 'cyan');
  
  try {
    switch (command) {
      case 'analyze':
        const queries = scanForQueries();
        const report = generateReport(queries);
        
        log('\n📋 Analysis Complete!', 'green');
        log(`Found ${queries.length} queries with ${report.summary.totalSuggestions} optimization suggestions`, 'white');
        
        if (report.recommendations.length > 0) {
          log('\n🎯 Top Recommendations:', 'yellow');
          report.recommendations.slice(0, 3).forEach((rec, index) => {
            log(`   ${index + 1}. ${rec.title} (${rec.priority})`, 'white');
          });
        }
        break;
        
      case 'optimize':
        log('🔧 Running optimization suggestions...', 'cyan');
        // TODO: Implement automatic optimizations
        log('⚠️  Automatic optimization not yet implemented', 'yellow');
        log('💡 Review the generated report for manual optimizations', 'blue');
        break;
        
      case 'monitor':
        await monitorPerformance();
        break;
        
      default:
        log('❌ Unknown command. Use: analyze, optimize, or monitor', 'red');
        process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  scanForQueries,
  generateReport,
  monitorPerformance
};