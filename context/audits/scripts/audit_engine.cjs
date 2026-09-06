const fs = require('fs');
const path = require('path');

const TRACKER_DIR = 'C:/dev/moja-buss/context/audits/moja-ride-design-system-audit/trackers';
if (!fs.existsSync(TRACKER_DIR)) {
  fs.mkdirSync(TRACKER_DIR, { recursive: true });
}

// Helper to scan directory recursively
function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.css']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.next' || file === '.expo' || file === 'dist' || file === '.git') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full, exts));
    } else {
      const ext = path.extname(file);
      if (exts.includes(ext)) {
        results.push(full.replace(/\\/g, '/'));
      }
    }
  }
  return results;
}

// Analysis function for a single file
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lineCount = lines.length;
  const ext = path.extname(filePath);
  const relPath = filePath.replace('C:/dev/moja-buss/', '');

  // Regex patterns
  // Filter out internal SVG attribute selectors like [stroke='#ccc'] in UI primitives
  const sanitizedContent = content.replace(/\[(?:stroke|fill)=['"]#[0-9a-fA-F]+['"]\]/g, '');
  const hexMatches = sanitizedContent.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g) || [];
  const arbitraryColorMatches = content.match(/(?:bg|text|border|ring|fill|stroke)-\[#(?:[0-9a-fA-F]{3,4}){1,2}\]/g) || [];
  const arbitrarySpacingMatches = content.match(/(?:p|m|gap|h|w|top|bottom|left|right)-\[[^\]]+\]/g) || [];
  const rawColorClasses = content.match(/\b(?:bg|text|border)-(?:zinc|slate|gray|neutral|red|emerald|blue|amber|rose|orange)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g) || [];
  
  // Primitives
  const rawButtons = (content.match(/<button\b/g) || []).length;
  const rawInputs = (content.match(/<input\b/g) || []).length;
  const rawSelects = (content.match(/<select\b/g) || []).length;
  const rawTouchables = (content.match(/<TouchableOpacity\b/g) || []).length;
  const rawPressables = (content.match(/<Pressable\b/g) || []).length;

  // Design system imports
  const usesThemeTokens = /import.*(?:theme|colors|tokens)/i.test(content) || /from ["']@\/constants\/theme["']/.test(content);
  const usesSharedUI = /from ["']@repo\/ui/i.test(content) || /from ["']@\/components\/ui/i.test(content);
  const usesNativeWind = /className=/i.test(content);

  // States
  const hasLoadingState = /loading|isLoading|ActivityIndicator|Skeleton|Spinner/i.test(content);
  const hasErrorState = /isError|error|fallback|Alert|errorMessage/i.test(content);
  const hasEmptyState = /empty|isEmpty|no results|not found|EmptyState/i.test(content);
  const hasDisabledState = /disabled/i.test(content);

  // A11y
  const hasAria = /aria-|role=|accessibilityLabel|accessibilityRole/i.test(content);

  // Deduplicate matched hexes
  const uniqueHexes = [...new Set(hexMatches)];
  const uniqueArbitraryColors = [...new Set(arbitraryColorMatches)];
  const uniqueRawColorClasses = [...new Set(rawColorClasses)];

  // Determine role
  let role = 'Component';
  if (relPath.includes('/app/') && (relPath.endsWith('page.tsx') || relPath.endsWith('layout.tsx') || relPath.endsWith('.tsx'))) {
    role = relPath.includes('layout') ? 'App Layout' : 'Screen Route';
  } else if (relPath.includes('/components/ui/')) {
    role = 'UI Primitive';
  } else if (relPath.includes('/features/notifications/')) {
    role = 'Notification Workflow / Email Template';
  } else if (relPath.includes('/features/')) {
    role = 'Feature Module';
  } else if (relPath.includes('/hooks/')) {
    role = 'Custom Hook';
  } else if (relPath.includes('/constants/') || relPath.includes('tokens.ts') || relPath.includes('packages/theme/') || relPath.endsWith('global.css') || relPath.endsWith('globals.css')) {
    role = 'Theme / Token Definition';
  } else if (relPath.includes('/lib/')) {
    role = 'Library Utility';
  } else if (relPath.includes('/stores/')) {
    role = 'State Store';
  } else if (relPath.includes('/api/') || relPath.includes('/trpc/')) {
    role = 'Backend API Route';
  } else if (relPath.includes('/scripts/')) {
    role = 'Build / Maintenance Script';
  } else if (relPath.includes('__tests__') || relPath.includes('.test.')) {
    role = 'Test Suite';
  }

  // Determine status
  let status = '🟢 Fully Compliant';
  const isEmailTemplate = role === 'Notification Workflow / Email Template';
  const isTokenDefinition = role === 'Theme / Token Definition';
  const isBackendApi = role === 'Backend API Route';
  const isScript = role === 'Build / Maintenance Script';
  const isUIPrimitive = role === 'UI Primitive';
  const isExemptFromHexRules = isEmailTemplate || isTokenDefinition || isBackendApi || isScript;
  const rawElementViolations = (isUIPrimitive || isScript) ? 0 : ((rawButtons > 0 ? 1 : 0) + (rawInputs > 0 ? 1 : 0));
  const totalViolations = isExemptFromHexRules ? 0 : (uniqueHexes.length + uniqueArbitraryColors.length + rawElementViolations);

  if (!isExemptFromHexRules && (totalViolations >= 5 || uniqueArbitraryColors.length >= 3)) {
    status = '🔴 Critical Violation';
  } else if (isTokenDefinition || isEmailTemplate || isScript || isBackendApi) {
    status = '🟢 Fully Compliant';
  } else if (totalViolations > 0 || uniqueRawColorClasses.length > 2) {
    status = '🟡 Minor Drift';
  }

  return {
    relPath,
    ext,
    lineCount,
    role,
    status,
    uniqueHexes,
    uniqueArbitraryColors,
    uniqueRawColorClasses,
    arbitrarySpacingMatches: arbitrarySpacingMatches.slice(0, 5),
    rawButtons,
    rawInputs,
    rawSelects,
    rawTouchables,
    rawPressables,
    usesThemeTokens,
    usesSharedUI,
    usesNativeWind,
    hasLoadingState,
    hasErrorState,
    hasEmptyState,
    hasDisabledState,
    hasAria
  };
}

module.exports = { getFiles, auditFile, TRACKER_DIR };
console.log('Audit helper engine initialized.');
