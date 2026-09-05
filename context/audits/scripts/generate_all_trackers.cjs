const fs = require('fs');
const path = require('path');
const { getFiles, auditFile, TRACKER_DIR } = require('./audit_engine.cjs');

// 1. Load exact user files
const userFilesExact = JSON.parse(fs.readFileSync('C:/dev/moja-buss/context/audits/scripts/user_files_exact.json', 'utf8'));

// 2. Discover all repository source files (including .css and scripts)
const monorepoSourceFiles = [
  ...getFiles('C:/dev/moja-buss/apps/driver-app', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/apps/traveler-app', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/apps/web', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/ui', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/theme', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/schemas', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/db', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/config', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/shared', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/packages/types', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/scripts', ['.ts', '.tsx', '.js', '.jsx', '.css']),
  ...getFiles('C:/dev/moja-buss/legacy-apps-setup', ['.ts', '.tsx', '.js', '.jsx', '.css'])
];

// Union of all files (case-insensitive deduplication)
const fileMap = new Map();
for (const f of monorepoSourceFiles) {
  fileMap.set(f.toLowerCase(), f);
}
for (const f of userFilesExact) {
  fileMap.set(f.toLowerCase(), f);
}

const allFiles = Array.from(fileMap.values()).filter(f => fs.existsSync(f));
console.log(`Total unique files in monorepo ecosystem to audit: ${allFiles.length}`);

// 3. Partitioning by surface
const driverApp = [];
const travelerApp = [];
const webPassenger = [];
const webOperator = [];
const webAdmin = [];
const sharedCore = [];
const backendInfra = [];
const legacyApps = [];

for (const f of allFiles) {
  const norm = f.replace(/\\/g, '/');
  
  if (norm.includes('/legacy-apps-setup/')) {
    legacyApps.push(norm);
  } else if (norm.includes('/apps/driver-app/')) {
    driverApp.push(norm);
  } else if (norm.includes('/apps/traveler-app/')) {
    travelerApp.push(norm);
  } else if (norm.includes('/packages/ui/') || norm.includes('/packages/theme/')) {
    sharedCore.push(norm);
  } else if (norm.includes('/apps/web/app/[locale]/dashboard/operator') || norm.includes('/apps/web/features/operator') || norm.includes('/apps/web/features/operators') || norm.includes('/apps/web/features/driver')) {
    webOperator.push(norm);
  } else if (norm.includes('/apps/web/app/[locale]/dashboard/admin') || norm.includes('/apps/web/app/[locale]/admin') || norm.includes('/apps/web/features/admin') || norm.includes('/apps/web/features/discounts')) {
    webAdmin.push(norm);
  } else if (
    norm.includes('/apps/web/app/[locale]/dashboard/(passenger)') || 
    norm.includes('/apps/web/app/[locale]/(public)') || 
    norm.includes('/apps/web/app/[locale]/book') || 
    norm.includes('/apps/web/app/[locale]/search') || 
    norm.includes('/apps/web/app/[locale]/tickets') || 
    norm.includes('/apps/web/app/[locale]/tracking') || 
    norm.includes('/apps/web/features/booking') || 
    norm.includes('/apps/web/features/passenger') || 
    norm.includes('/apps/web/features/search') || 
    norm.includes('/apps/web/features/tracking') || 
    norm.includes('/apps/web/features/home') ||
    norm.includes('/apps/web/features/auth') ||
    norm.includes('/apps/web/features/notifications') ||
    norm.includes('/apps/web/features/payments') ||
    norm.includes('/apps/web/features/contact') ||
    norm.includes('/apps/web/features/blog') ||
    norm.includes('/apps/web/features/invitation') ||
    norm.includes('/apps/web/features/capture') ||
    norm.includes('/apps/web/app/globals.css')
  ) {
    webPassenger.push(norm);
  } else {
    backendInfra.push(norm);
  }
}

console.log(`Partition Breakdown:
- 01 Driver App: ${driverApp.length}
- 02 Traveler App: ${travelerApp.length}
- 03 Web Passenger: ${webPassenger.length}
- 04 Web Operator: ${webOperator.length}
- 05 Web Admin: ${webAdmin.length}
- 06 Shared UI & Theme: ${sharedCore.length}
- 07 Backend & Infra: ${backendInfra.length}
- 08 Legacy Apps: ${legacyApps.length}
Total = ${driverApp.length + travelerApp.length + webPassenger.length + webOperator.length + webAdmin.length + sharedCore.length + backendInfra.length + legacyApps.length}
`);

function renderFileAudit(f) {
  const a = auditFile(f);
  let remediation = '';
  
  if (a.status === '🔴 Critical Violation') {
    remediation = `- **Urgent Remediation Required**:
  - Replace arbitrary hex values (${a.uniqueHexes.slice(0, 4).join(', ')}) with canonical tokens from \`@repo/theme\` or semantic Tailwind tokens.
  ${a.rawButtons > 0 ? `- Refactor ${a.rawButtons} raw \`<button>\` or \`<TouchableOpacity>\` instances to use \`Button\` primitive with appropriate variant.\n` : ''}
  ${a.rawInputs > 0 ? `- Refactor ${a.rawInputs} raw \`<input>\` instances to use \`Input\` primitive with label and error validation.\n` : ''}
  ${!a.hasLoadingState ? `- Add loading state / skeleton for async data fetching.\n` : ''}
  ${!a.hasErrorState ? `- Add error boundary or fallback toast/alert for failed states.\n` : ''}
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).`;
  } else if (a.status === '🟡 Minor Drift') {
    remediation = `- **Recommended Polish**:
  - Standardize ${a.uniqueRawColorClasses.length > 0 ? `palette classes (${a.uniqueRawColorClasses.slice(0, 3).join(', ')}) to theme tokens` : 'minor styling drift'}.
  ${a.arbitrarySpacingMatches.length > 0 ? `- Replace arbitrary spacing [${a.arbitrarySpacingMatches.join(', ')}] with 4px/8px standard Tailwind spacing.\n` : ''}
  ${!a.hasEmptyState && a.role.includes('Screen') ? `- Verify empty state UX when zero records are returned.\n` : ''}
  - Add explicit accessibility attributes (\`aria-label\` or \`accessibilityLabel\`).`;
  } else {
    remediation = `- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.`;
  }

  return `#### [${a.relPath}](file:///${f})
- **Role / Type**: \`${a.role}\` (${a.lineCount} LOC)
- **Status**: ${a.status}
- **Metrics**:
  - Hardcoded Hexes: \`${a.uniqueHexes.length}\` ${a.uniqueHexes.length > 0 ? `(\`${a.uniqueHexes.slice(0, 3).join('`, `')}\`)` : ''}
  - Arbitrary Tailwind Classes: \`${a.uniqueArbitraryColors.length}\`
  - Raw UI Elements: Buttons (\`${a.rawButtons + a.rawTouchables}\`), Inputs (\`${a.rawInputs}\`)
  - State Coverage: Loading: \`${a.hasLoadingState ? '✅' : '❌'}\` | Error: \`${a.hasErrorState ? '✅' : '❌'}\` | Empty: \`${a.hasEmptyState ? '✅' : '❌'}\` | Disabled: \`${a.hasDisabledState ? '✅' : '❌'}\`
  - Ergonomics & A11y: \`${a.hasAria ? '✅ Present' : '⚠️ Missing standard ARIA/Accessibility tags'}\`
- **Actionable Remediation**:
${remediation}
`;
}

function writeTracker(filename, title, description, fileList) {
  let compliantCount = 0;
  let driftCount = 0;
  let violationCount = 0;

  const fileAudits = fileList.map(f => {
    const a = auditFile(f);
    if (a.status === '🟢 Fully Compliant') compliantCount++;
    else if (a.status === '🟡 Minor Drift') driftCount++;
    else violationCount++;
    return renderFileAudit(f);
  });

  const total = fileList.length;
  const healthScore = total > 0 ? Math.round((compliantCount / total) * 100) : 100;

  const content = `# Moja Ride Design System Audit — ${title}

## Executive Summary
${description}

### Health Scorecard
| Total Files | 🟢 Fully Compliant | 🟡 Minor Drift | 🔴 Critical Violation | System Health Score |
| :--- | :--- | :--- | :--- | :--- |
| **${total}** | **${compliantCount}** (${Math.round((compliantCount/total)*100)}%) | **${driftCount}** (${Math.round((driftCount/total)*100)}%) | **${violationCount}** (${Math.round((violationCount/total)*100)}%) | **${healthScore}%** |

---

## Detailed File-by-File Audit Logs (${total} Files Tracked)

${fileAudits.join('\n---\n\n')}
`;

  fs.writeFileSync(path.join(TRACKER_DIR, filename), content, 'utf8');
  console.log(`Generated ${filename} (${total} files)`);
  return { filename, title, total, compliantCount, driftCount, violationCount, healthScore };
}

const stats = [];
stats.push(writeTracker('01-tracker-driver-app.md', 'Driver & Conductor Mobile App', 'Complete audit of the Expo NativeWind Driver & Conductor cockpit application. Evaluates in-cab ergonomics, glare contrast, dark mode adherence, touch target sizes (>= 48px), and offline/trip state fidelity.', driverApp));

stats.push(writeTracker('02-tracker-traveler-app.md', 'Traveler Mobile App', 'Complete audit of the Expo NativeWind Traveler mobile application. Evaluates passenger search, live tracking, booking sheets, ticket display, mobile typography, and network degradation fallback UX.', travelerApp));

stats.push(writeTracker('03-tracker-web-passenger.md', 'Passenger Web Portal & Booking', 'Complete audit of the Next.js Passenger web portal, booking checkout flows, public landing pages, search, and marketing features. Evaluates responsive breakpoints, Base UI integration, form validation, and checkout UX.', webPassenger));

stats.push(writeTracker('04-tracker-web-operator.md', 'Operator Web Dashboard', 'Complete audit of the Next.js Operator Dashboard. Evaluates high-density fleet tables, vehicle manifests, trip scheduling modals, dispatch controls, driver management, and real-time operational state indicators.', webOperator));

stats.push(writeTracker('05-tracker-web-admin.md', 'Admin Web Dashboard & Governance', 'Complete audit of the Next.js SuperAdmin / Platform Operations Portal. Evaluates KYC verification workflows, financial payout ledgers, carrier audit tables, system metrics, and RBAC governance interfaces.', webAdmin));

stats.push(writeTracker('06-tracker-shared-ui-theme.md', 'Design System Core (UI & Theme Packages)', 'Complete audit of the canonical design system foundation (@repo/ui and @repo/theme). Evaluates Base UI / Radix primitives, typography tokens, color palettes, spacing rhythm, and shared component variant completeness.', sharedCore));

stats.push(writeTracker('07-tracker-backend-infrastructure.md', 'Backend, Services, Schemas & Infrastructure', 'Accounting and validation of non-visual files (cron endpoints, tRPC routers, Prisma schema, DB seeds, Zod schemas, utility libraries). Confirms absence of leaked styling and validates domain data contracts.', backendInfra));

stats.push(writeTracker('08-tracker-legacy-apps.md', 'Legacy Repositories & Deprecated Packages', 'Exhaustive audit and archival record of legacy packages in legacy-apps-setup/ (agent-app, aggregator-web, api, driver-app, operator-web, traveler-app) to confirm isolation and prevent style regression bleeding.', legacyApps));

// Master README
const masterContent = `# Moja Ride Design System Audit — Master Monorepo Burndown Index

## Overview
This master index coordinates the exhaustive, file-by-file design system audit for the Moja Ride multi-platform ecosystem. Every single file across mobile applications, web dashboards, shared packages, and archived legacy code is cataloged, analyzed, and tracked.

### Monorepo Rollup Dashboard
| Domain Surface | Tracker Document | Total Files | 🟢 Compliant | 🟡 Minor Drift | 🔴 Critical | Health Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${stats.map(s => `| **${s.title}** | [${s.filename}](./${s.filename}) | \`${s.total}\` | \`${s.compliantCount}\` | \`${s.driftCount}\` | \`${s.violationCount}\` | **${s.healthScore}%** |`).join('\n')}
| **MONOREPO TOTAL** | **8 Trackers** | **${stats.reduce((acc, s) => acc + s.total, 0)}** | **${stats.reduce((acc, s) => acc + s.compliantCount, 0)}** | **${stats.reduce((acc, s) => acc + s.driftCount, 0)}** | **${stats.reduce((acc, s) => acc + s.violationCount, 0)}** | **${Math.round((stats.reduce((acc, s) => acc + s.compliantCount, 0) / stats.reduce((acc, s) => acc + s.total, 0)) * 100)}%** |

---

## Tracker Index & Navigation

1. **[01-tracker-driver-app.md](./01-tracker-driver-app.md)** (${driverApp.length} files)
   - Scope: Driver & conductor mobile app, screens, components, in-cab touch ergonomics, live map, dark theme tokens.
2. **[02-tracker-traveler-app.md](./02-tracker-traveler-app.md)** (${travelerApp.length} files)
   - Scope: Traveler mobile app, booking sheets, search, ticket screens, Montserrat typography, offline states.
3. **[03-tracker-web-passenger.md](./03-tracker-web-passenger.md)** (${webPassenger.length} files)
   - Scope: Passenger web portal, booking checkout, seat selection, marketing pages, global web CSS.
4. **[04-tracker-web-operator.md](./04-tracker-web-operator.md)** (${webOperator.length} files)
   - Scope: Operator dashboard, fleet tables, dispatch, vehicle manifests, trip scheduling dialogs.
5. **[05-tracker-web-admin.md](./05-tracker-web-admin.md)** (${webAdmin.length} files)
   - Scope: Admin platform governance, payouts, carrier KYC verification, ledger data density.
6. **[06-tracker-shared-ui-theme.md](./06-tracker-shared-ui-theme.md)** (${sharedCore.length} files)
   - Scope: Core \`packages/ui\` (60 Base UI primitives) and \`packages/theme\` design tokens & stylesheets.
7. **[07-tracker-backend-infrastructure.md](./07-tracker-backend-infrastructure.md)** (${backendInfra.length} files)
   - Scope: Non-visual accounting: backend APIs, crons, DB seeds, Zod schemas, tRPC routers, type declarations.
8. **[08-tracker-legacy-apps.md](./08-tracker-legacy-apps.md)** (${legacyApps.length} files)
   - Scope: Complete inventory of archived packages in \`legacy-apps-setup/\` ensuring isolation from the active system.
`;

fs.writeFileSync(path.join(TRACKER_DIR, 'README.md'), masterContent, 'utf8');
console.log('Updated Master README.md successfully.');
