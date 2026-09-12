const fs = require('fs');
const path = require('path');

const trackerPath = 'C:/dev/moja-buss/context/audits/booth-app-tracker.md';
let content = fs.readFileSync(trackerPath, 'utf8');

// Update lines 52 to 74 in the table
const lines = content.split('\n');
const updatedLines = lines.map(line => {
  const match = line.match(/^\|\s*(\d+)\s*\|/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (id >= 52 && id <= 74) {
      // Replace `NOT_STARTED` | `NOT_STARTED` with `AUDITED` | `READY`
      return line.replace(/`NOT_STARTED`\s*\|\s*`NOT_STARTED`/, '`AUDITED` | `READY`');
    }
  }
  return line;
});

content = updatedLines.join('\n');

// Update summary metrics in Section 1 of tracker
content = content.replace(
  /Completed Audits\*\*: \d+ \/ 74 \([\d.]+%\)/,
  'Completed Audits**: 74 / 74 (100.0%)'
);
content = content.replace(
  /Audited & Ready for Refactor\*\*: \d+ \/ 74/,
  'Audited & Ready for Refactor**: 74 / 74'
);
content = content.replace(
  /Remaining to Audit\*\*: \d+ \/ 74/,
  'Remaining to Audit**: 0 / 74'
);

fs.writeFileSync(trackerPath, content, 'utf8');
console.log('Successfully updated tracker for rows 52-74!');
