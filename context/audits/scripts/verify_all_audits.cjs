const fs = require('fs');
const path = require('path');

const trackerPath = 'C:/dev/moja-buss/context/audits/booth-app-tracker.md';
const content = fs.readFileSync(trackerPath, 'utf8');

const tableLines = content.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
console.log('Total table items found in tracker:', tableLines.length);

let notAudited = 0;
let missingSectionsCount = 0;
let missingFilesCount = 0;

tableLines.forEach(line => {
  const parts = line.split('|').map(p => p.trim());
  const id = parts[1];
  const file = parts[2];
  const auditStatus = parts[4];
  const refactorStatus = parts[5];
  const reportLink = parts[9];

  if (auditStatus !== '`AUDITED`' || refactorStatus !== '`READY`') {
    console.log(`Item ${id} (${file}) has status ${auditStatus} / ${refactorStatus}`);
    notAudited++;
  }

  // Extract link target from [Report](...)
  const reportMatch = reportLink.match(/\[Report\]\((.*)\)/);
  if (reportMatch) {
    const reportRel = reportMatch[1].replace(/^\.\//, '');
    const reportFull = path.join('C:/dev/moja-buss/context/audits', reportRel);
    if (!fs.existsSync(reportFull)) {
      console.log(`Missing report file for item ${id}: ${reportFull}`);
      missingFilesCount++;
    } else {
      const repContent = fs.readFileSync(reportFull, 'utf8');
      for (let s = 1; s <= 28; s++) {
        if (!repContent.includes(`## ${s}.`)) {
          console.log(`Report for item ${id} (${reportRel}) is missing section ${s}`);
          missingSectionsCount++;
        }
      }
    }
  } else {
    console.log(`Could not parse report link for item ${id}: ${reportLink}`);
  }
});

console.log(`Verification finished.`);
console.log(`- Total items verified: ${tableLines.length}`);
console.log(`- Total non-audited items: ${notAudited}`);
console.log(`- Total missing report files: ${missingFilesCount}`);
console.log(`- Total missing sections across all reports: ${missingSectionsCount}`);
