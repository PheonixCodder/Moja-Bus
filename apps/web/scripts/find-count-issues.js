const fs = require('fs');
const path = require('path');

function findCountKeys(obj, currentPath, results) {
  currentPath = currentPath || '';
  results = results || [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? currentPath + '.' + key : key;
    if (typeof value === 'string' && value.includes('{count}')) {
      results.push({ path: fullPath, value: value });
    } else if (typeof value === 'object' && value !== null) {
      findCountKeys(value, fullPath, results);
    }
  }
  return results;
}

const en = require('../messages/en.json');
const countKeys = findCountKeys(en);

function findJsTsFiles(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.next') && !entry.name.includes('dist') && !entry.name.includes('scratch')) {
      findJsTsFiles(fullPath, results);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findJsTsFiles('.');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const issues = [];

for (const keyInfo of countKeys) {
  const key = keyInfo.path;
  const keyRegex = escapeRegex(key);

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tCallMatch = line.match(new RegExp('t\\s*\\(\\s*[`"\x27]' + keyRegex + '[`"\x27]'));
      if (!tCallMatch) continue;

      // Check if this t() call has a count parameter
      // Collect the full t() call (may span multiple lines)
      let fullCall = line;
      let parenDepth = 0;
      let startParen = -1;
      for (let j = 0; j < line.length; j++) {
        if (line[j] === '(') {
          if (parenDepth === 0) startParen = j;
          parenDepth++;
        } else if (line[j] === ')') {
          parenDepth--;
        }
      }

      // If the call spans multiple lines, collect them
      if (parenDepth > 0) {
        for (let k = i + 1; k < lines.length && k < i + 10; k++) {
          fullCall += '\n' + lines[k];
          parenDepth = (lines[k].match(/\(/g) || []).length - (lines[k].match(/\)/g) || []).length;
          if (parenDepth <= 0) break;
        }
      }

      // Check if count parameter is present
      const hasCountParam = /count\s*:/.test(fullCall);

      if (!hasCountParam) {
        issues.push({
          key: key,
          messageValue: keyInfo.value,
          file: file,
          lineNum: i + 1,
          lineContent: line.trim().substring(0, 150),
          fullCall: fullCall.trim().substring(0, 300)
        });
      }
    }
  }
}

// Deduplicate by key+file+line
const seen = new Set();
const uniqueIssues = issues.filter(issue => {
  const sig = issue.key + '|' + issue.file + '|' + issue.lineNum;
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
});

console.log('=== ISSUES: Keys with {count} placeholder but no count parameter passed ===');
console.log('Total such keys:', countKeys.length);
console.log('Total issues found:', uniqueIssues.length);
console.log('');

// Group by key
const grouped = {};
for (const issue of uniqueIssues) {
  if (!grouped[issue.key]) grouped[issue.key] = [];
  grouped[issue.key].push(issue);
}

for (const [key, group] of Object.entries(grouped)) {
  console.log('--- Key: ' + key + ' ---');
  console.log('  Message value: ' + group[0].messageValue);
  console.log('  Occurrences: ' + group.length);
  for (const issue of group) {
    console.log('  ' + issue.file + ':' + issue.lineNum);
    console.log('    ' + issue.lineContent.substring(0, 120));
  }
  console.log('');
}
