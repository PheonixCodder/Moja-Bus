const fs = require('fs');
const path = require('path');
const { getFiles } = require('./audit_engine.cjs');

const transcriptPath = 'C:/Users/ubaid/.gemini/antigravity-cli/brain/a3c1c557-a7b3-4263-9c4d-f641ab2a3b6d/.system_generated/logs/transcript_full.jsonl';

// 1. Read last user message from transcript
const content = fs.readFileSync(transcriptPath, 'utf8');
const lines = content.split(/\r?\n/).filter(Boolean);
let lastUserMessage = '';

for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const parsed = JSON.parse(lines[i]);
    if (parsed.type === 'USER_INPUT' && parsed.content.includes('Are all these files present')) {
      lastUserMessage = parsed.content;
      break;
    }
  } catch (e) {}
}

if (!lastUserMessage) {
  console.error('Could not find user message in transcript');
  process.exit(1);
}

// 2. Extract files from user message
const userFiles = [];
const pMatches = lastUserMessage.split(/\r?\n/);
for (const line of pMatches) {
  const trimmed = line.trim();
  if (trimmed.startsWith('Processing:')) {
    const f = trimmed.replace(/^Processing:\s*/, '').trim();
    if (f) userFiles.push(f);
  }
}

console.log('=== USER LIST VERIFICATION ===');
console.log(`Total files listed by user: ${userFiles.length}`);

// 3. Check presence on disk
let presentCount = 0;
let missingFromDisk = [];
const normalizedUserFiles = [];

for (const f of userFiles) {
  const winPath = f.replace(/^\/c\//i, 'C:/');
  normalizedUserFiles.push(winPath);
  if (fs.existsSync(winPath)) {
    presentCount++;
  } else {
    missingFromDisk.push(f);
  }
}

console.log(`Present on disk: ${presentCount} / ${userFiles.length}`);
console.log(`Missing from disk: ${missingFromDisk.length}`);
if (missingFromDisk.length > 0) {
  console.log('Missing files:', missingFromDisk);
}

// 4. Check presence in the 7 Trackers
const trackerDir = 'C:/dev/moja-buss/context/audits/moja-ride-design-system-audit/trackers';
const trackerFiles = fs.readdirSync(trackerDir).filter(f => f.endsWith('.md') && f !== 'README.md');

let allTrackerText = '';
for (const tf of trackerFiles) {
  allTrackerText += fs.readFileSync(path.join(trackerDir, tf), 'utf8') + '\n';
}

let inTrackersCount = 0;
let notInTrackers = [];

for (const f of normalizedUserFiles) {
  const rel = f.replace('C:/dev/moja-buss/', '');
  if (allTrackerText.includes(rel)) {
    inTrackersCount++;
  } else {
    notInTrackers.push(rel);
  }
}

console.log(`\n=== TRACKER COVERAGE OF USER LIST ===`);
console.log(`Files in current trackers: ${inTrackersCount} / ${userFiles.length}`);
console.log(`Files not in current trackers: ${notInTrackers.length}`);
if (notInTrackers.length > 0) {
  console.log('Files not yet in trackers (e.g. legacy/scripts/types):', notInTrackers.slice(0, 15));
}

// 5. Monorepo Files MISSED by the User
const monorepoSourceFiles = [
  ...getFiles('C:/dev/moja-buss/apps/driver-app'),
  ...getFiles('C:/dev/moja-buss/apps/traveler-app'),
  ...getFiles('C:/dev/moja-buss/apps/web'),
  ...getFiles('C:/dev/moja-buss/packages/ui'),
  ...getFiles('C:/dev/moja-buss/packages/theme'),
  ...getFiles('C:/dev/moja-buss/packages/schemas'),
  ...getFiles('C:/dev/moja-buss/packages/db')
];

const userNormalizedSet = new Set(normalizedUserFiles.map(f => f.toLowerCase()));
const missedByUser = [];

for (const mf of monorepoSourceFiles) {
  if (!userNormalizedSet.has(mf.toLowerCase())) {
    missedByUser.push(mf.replace('C:/dev/moja-buss/', ''));
  }
}

console.log(`\n=== MONOREPO FILES MISSED BY USER ===`);
console.log(`Total active monorepo source files: ${monorepoSourceFiles.length}`);
console.log(`Total monorepo files MISSED in user list: ${missedByUser.length}`);

fs.writeFileSync('C:/dev/moja-buss/context/audits/scripts/verification_results.json', JSON.stringify({
  totalUserFiles: userFiles.length,
  presentOnDisk: presentCount,
  missingFromDisk,
  inTrackersCount,
  notInTrackers,
  totalMonorepoFiles: monorepoSourceFiles.length,
  totalMissedByUser: missedByUser.length,
  missedSample: missedByUser.slice(0, 50)
}, null, 2));
console.log('Detailed verification results written to context/audits/scripts/verification_results.json');
