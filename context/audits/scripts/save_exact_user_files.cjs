const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:/Users/ubaid/.gemini/antigravity-cli/brain/a3c1c557-a7b3-4263-9c4d-f641ab2a3b6d/.system_generated/logs/transcript_full.jsonl';
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

const userFiles = [];
const pMatches = lastUserMessage.split(/\r?\n/);
for (const line of pMatches) {
  const trimmed = line.trim();
  if (trimmed.startsWith('Processing:')) {
    const f = trimmed.replace(/^Processing:\s*/, '').trim();
    if (f) userFiles.push(f.replace(/^\/c\//i, 'C:/'));
  }
}

fs.writeFileSync('C:/dev/moja-buss/context/audits/scripts/user_files_exact.json', JSON.stringify(userFiles, null, 2));
console.log(`Saved exact ${userFiles.length} user files to user_files_exact.json`);
