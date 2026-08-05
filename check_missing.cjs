const fs = require('fs');
const basePath = 'C:/dev/moja-buss/apps/web/features';
const tracker = fs.readFileSync('C:/dev/moja-buss/context/trackers/internationalization-components.md', 'utf8');
const lines = tracker.split('\n');
const missing = [];
for (const line of lines) {
  if (!line.includes('✗')) continue;
  const numMatch = line.match(/\| (\d+) \|/);
  const nameMatch = line.match(/\| ([\w-]+) \|/);
  const pathMatch = line.match(/`([^`]+)`/);
  if (numMatch && nameMatch && pathMatch) {
    missing.push({ num: numMatch[1], name: nameMatch[2], filePath: pathMatch[1] });
  }
}

let alreadyDone = 0;
let needsWork = 0;
const needsWorkList = [];

for (const comp of missing) {
  const fullPath = basePath + '/' + comp.filePath;
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasTranslations = content.includes('useTranslations') || content.includes('getTranslations');
    if (hasTranslations) {
      alreadyDone++;
    } else {
      needsWork++;
      needsWorkList.push(comp);
    }
  } catch (e) {
    // file not found
  }
}

console.log('Already have translations:', alreadyDone);
console.log('Need work:', needsWork);
console.log('All that need work:');
for (const c of needsWorkList) {
  console.log(c.num, c.name, c.filePath);
}