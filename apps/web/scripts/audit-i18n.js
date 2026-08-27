/**
 * audit-i18n.js
 * Comprehensive i18n scanner for apps/web:
 * 1. Finds t('key') calls that reference missing keys in en.json / fr.json.
 * 2. Finds hardcoded user-visible text in JSX elements (<span>Text</span>, <button>Label</button>).
 * 3. Finds hardcoded user-visible JSX attributes (placeholder="...", aria-label="...", title="...").
 * 4. Finds keys in en.json that are missing in fr.json.
 *
 * Run: node apps/web/scripts/audit-i18n.js [--json] [--markdown] [--feature=<name>]
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const WEB_ROOT = path.resolve(__dirname, "..");
const FEATURES_DIR = path.join(WEB_ROOT, "features");
const MESSAGES_DIR = path.join(WEB_ROOT, "messages");

// CLI arguments
const args = process.argv.slice(2);
const OUTPUT_JSON = args.includes("--json");
const OUTPUT_MD = args.includes("--markdown");
const FEATURE_FILTER = args
  .find((a) => a.startsWith("--feature="))
  ?.split("=")[1];

// ─── 1. Load and Merge Locale Dictionaries ─────────────────────────────────
function loadMessages(locale) {
  const merged = {};
  const globalPath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (fs.existsSync(globalPath)) {
    Object.assign(merged, JSON.parse(fs.readFileSync(globalPath, "utf8")));
  }

  if (fs.existsSync(FEATURES_DIR)) {
    const features = fs.readdirSync(FEATURES_DIR);
    for (const feat of features) {
      const featMsgPath = path.join(
        FEATURES_DIR,
        feat,
        "messages",
        `${locale}.json`,
      );
      if (fs.existsSync(featMsgPath)) {
        Object.assign(merged, JSON.parse(fs.readFileSync(featMsgPath, "utf8")));
      }
    }
  }
  return merged;
}

const enMessages = loadMessages("en");
const frMessages = loadMessages("fr");

function getNestedValue(obj, dotPath) {
  if (!dotPath) return obj;
  const parts = dotPath.split(".");
  let cur = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) {
      return undefined;
    }
    cur = cur[part];
  }
  return cur;
}

// ─── 2. Find missing keys between EN and FR ────────────────────────────────
const enMissingInFr = [];
function findMissingEnInFr(enObj, frObj, currentPath = "") {
  for (const key of Object.keys(enObj)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    if (!(key in frObj)) {
      enMissingInFr.push(fullPath);
    } else if (
      typeof enObj[key] === "object" &&
      enObj[key] !== null &&
      !Array.isArray(enObj[key])
    ) {
      findMissingEnInFr(enObj[key], frObj[key] || {}, fullPath);
    }
  }
}
findMissingEnInFr(enMessages, frMessages);

// ─── 3. Scan Files for Missing Keys & Hardcoded Text ───────────────────────
const USER_VISIBLE_ATTRIBUTES = new Set([
  "placeholder",
  "aria-label",
  "title",
  "alt",
  "label",
  "description",
  "helperText",
  "tooltip",
  "emptyText",
  "errorMessage",
]);

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "scripts",
  "coverage",
  "__tests__",
]);

function getAllSourceFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllSourceFiles(fullPath, list);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      if (entry.name.endsWith(".d.ts")) continue;
      list.push(fullPath);
    }
  }
  return list;
}

const targetDirs = FEATURE_FILTER
  ? [path.join(FEATURES_DIR, FEATURE_FILTER)]
  : [
      FEATURES_DIR,
      path.join(WEB_ROOT, "components"),
      path.join(WEB_ROOT, "app"),
    ];

const filesToScan = targetDirs.flatMap((d) => getAllSourceFiles(d));

// Natural language string filter
function isHardcodedEnglishText(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;

  // Ignore punctuation/symbols only: e.g. "•", "→", "/", "-", "+", "&middot;", "|"
  if (/^[\p{P}\p{S}\s\d]+$/u.test(trimmed)) return false;

  // Ignore CSS classes, Tailwind strings (e.g. "flex items-center gap-2", "text-sm text-muted-foreground")
  if (
    /^(?:flex|grid|hidden|block|inline|text-|bg-|p-|m-|gap-|w-|h-|border-|rounded-|font-|opacity-|z-|col-|row-)/.test(
      trimmed,
    )
  ) {
    return false;
  }

  // Ignore URLs / paths / IDs / CSS units / code vars
  if (
    /^(?:https?:\/\/|\/|#| MW-|MOB-|XOF|USD|EUR|%|px|rem|em|vh|vw|[a-z0-9_-]+\.[a-z0-9]+)/i.test(
      trimmed,
    )
  ) {
    return false;
  }

  // Ignore common SVG path / color hex / date formats
  if (/^(?:#[0-9a-fA-F]{3,8}|rgb|hsl|M[0-9]|L[0-9]|yyyy|hh:mm)/.test(trimmed)) {
    return false;
  }

  // Must contain letters forming actual words (at least 2 letters)
  return /[a-zA-Z]{2,}/.test(trimmed);
}

const report = {
  summary: {
    scannedFiles: filesToScan.length,
    filesWithMissingKeys: 0,
    filesWithHardcodedText: 0,
    totalMissingKeys: 0,
    totalHardcodedSnippets: 0,
    totalEnMissingInFr: enMissingInFr.length,
  },
  missingKeys: [],
  hardcodedText: [],
  missingInFr: enMissingInFr,
};

for (const filePath of filesToScan) {
  const relativePath = path.relative(WEB_ROOT, filePath).replace(/\\/g, "/");
  const fileContent = fs.readFileSync(filePath, "utf8");

  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  // Map variable names to their namespace: e.g. t -> "booking", tNav -> "nav"
  const tVariables = new Map();

  // Pass 1: Find useTranslations / getTranslations declarations
  function findTranslationVars(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const call = node.initializer;
      const callName = call.expression.getText(sourceFile);
      if (callName === "useTranslations" || callName === "getTranslations") {
        const varName = node.name.getText(sourceFile);
        const arg = call.arguments[0];
        const namespace = arg && ts.isStringLiteral(arg) ? arg.text : "";
        tVariables.set(varName, namespace);
      }
    }
    ts.forEachChild(node, findTranslationVars);
  }
  findTranslationVars(sourceFile);

  let fileHasMissingKeys = false;
  let fileHasHardcoded = false;

  // Pass 2: Check t('key') calls and JSX text/attributes
  function analyzeNode(node) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );
    const lineNum = line + 1;

    // 1. Translation call checks: t("key") or t.rich("key")
    if (ts.isCallExpression(node)) {
      let varName = null;
      let isRich = false;

      if (ts.isIdentifier(node.expression)) {
        varName = node.expression.text;
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression)
      ) {
        varName = node.expression.expression.text;
        isRich =
          node.expression.name.text === "rich" ||
          node.expression.name.text === "has";
      }

      if (varName && tVariables.has(varName)) {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          const key = firstArg.text;
          const namespace = tVariables.get(varName);
          const fullKeyPath = namespace ? `${namespace}.${key}` : key;

          const existsInEn =
            getNestedValue(enMessages, fullKeyPath) !== undefined;
          const existsInFr =
            getNestedValue(frMessages, fullKeyPath) !== undefined;

          if (!existsInEn || !existsInFr) {
            report.missingKeys.push({
              file: relativePath,
              line: lineNum,
              variable: varName,
              namespace,
              key,
              fullKeyPath,
              missingIn:
                !existsInEn && !existsInFr ? "both" : !existsInEn ? "en" : "fr",
            });
            fileHasMissingKeys = true;
          }
        }
      }
    }

    // 2. JSX Text checks: <span>Some Text</span>
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile);
      if (isHardcodedEnglishText(text)) {
        // Exclude if parent element is <style>, <script>, <code>, <pre>
        const parentTag =
          node.parent && ts.isJsxElement(node.parent)
            ? node.parent.openingElement.tagName.getText(sourceFile)
            : "";

        if (!["style", "script", "code", "pre"].includes(parentTag)) {
          report.hardcodedText.push({
            file: relativePath,
            line: lineNum,
            type: "jsx-text",
            text: text.trim().replace(/\s+/g, " "),
          });
          fileHasHardcoded = true;
        }
      }
    }

    // 3. JSX Attribute checks: placeholder="Search trips..."
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      if (USER_VISIBLE_ATTRIBUTES.has(attrName) && node.initializer) {
        let attrValue = null;
        if (ts.isStringLiteral(node.initializer)) {
          attrValue = node.initializer.text;
        } else if (
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isStringLiteral(node.initializer.expression)
        ) {
          attrValue = node.initializer.expression.text;
        }

        if (attrValue && isHardcodedEnglishText(attrValue)) {
          report.hardcodedText.push({
            file: relativePath,
            line: lineNum,
            type: `attribute:${attrName}`,
            text: attrValue.trim(),
          });
          fileHasHardcoded = true;
        }
      }
    }

    ts.forEachChild(node, analyzeNode);
  }

  analyzeNode(sourceFile);

  if (fileHasMissingKeys) report.summary.filesWithMissingKeys++;
  if (fileHasHardcoded) report.summary.filesWithHardcodedText++;
}

report.summary.totalMissingKeys = report.missingKeys.length;
report.summary.totalHardcodedSnippets = report.hardcodedText.length;

// ─── 4. Output Formatting ──────────────────────────────────────────────────
if (OUTPUT_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else if (OUTPUT_MD) {
  // Generate Markdown report
  console.log("# i18n Codebase Audit Report\n");
  console.log(`> Generated on ${new Date().toISOString().split("T")[0]}\n`);
  console.log("## Summary\n");
  console.log(`- **Files scanned:** ${report.summary.scannedFiles}`);
  console.log(
    `- **Files with hardcoded text:** ${report.summary.filesWithHardcodedText}`,
  );
  console.log(
    `- **Total hardcoded text occurrences:** ${report.summary.totalHardcodedSnippets}`,
  );
  console.log(
    `- **Missing \`t('key')\` translation keys:** ${report.summary.totalMissingKeys}`,
  );
  console.log(
    `- **EN keys missing in FR:** ${report.summary.totalEnMissingInFr}\n`,
  );

  if (report.missingKeys.length > 0) {
    console.log("## ❌ Missing Translation Keys in Code\n");
    console.log("| File | Line | Key Path | Missing In |");
    console.log("|---|---|---|---|");
    for (const item of report.missingKeys) {
      console.log(
        `| \`${item.file}\` | ${item.line} | \`${item.fullKeyPath}\` | ${item.missingIn.toUpperCase()} |`,
      );
    }
    console.log("\n");
  }

  if (report.hardcodedText.length > 0) {
    console.log("## ⚠️ Hardcoded UI Strings (Need Translation)\n");
    console.log("| File | Line | Type | Snippet |");
    console.log("|---|---|---|---|");
    for (const item of report.hardcodedText.slice(0, 200)) {
      const cleanSnippet = item.text.replace(/\|/g, "\\|").slice(0, 60);
      console.log(
        `| \`${item.file}\` | ${item.line} | \`${item.type}\` | ${cleanSnippet} |`,
      );
    }
    if (report.hardcodedText.length > 200) {
      console.log(
        `\n*... and ${report.hardcodedText.length - 200} more items.*`,
      );
    }
  }
} else {
  // Console summary
  console.log("\n=======================================================");
  console.log("            🌐 I18N CODEBASE AUDIT RESULTS            ");
  console.log("=======================================================");
  console.log(
    `📁 Files Scanned:                 ${report.summary.scannedFiles}`,
  );
  console.log(
    `❌ Missing Translation Keys:      ${report.summary.totalMissingKeys}`,
  );
  console.log(
    `⚠️  Hardcoded String Snippets:     ${report.summary.totalHardcodedSnippets}`,
  );
  console.log(
    `📄 Files with Hardcoded Strings:   ${report.summary.filesWithHardcodedText}`,
  );
  console.log(
    `🇫🇷 EN keys missing in FR:          ${report.summary.totalEnMissingInFr}`,
  );
  console.log("-------------------------------------------------------");

  // Group hardcoded text by feature
  const featureBreakdown = {};
  for (const item of report.hardcodedText) {
    const parts = item.file.split("/");
    const domain = parts[0] === "features" ? parts[1] : parts[0];
    featureBreakdown[domain] = (featureBreakdown[domain] || 0) + 1;
  }

  console.log("\n📊 Hardcoded Text Occurrences by Feature Area:\n");
  const sortedFeatures = Object.entries(featureBreakdown).sort(
    (a, b) => b[1] - a[1],
  );
  for (const [feat, count] of sortedFeatures) {
    const bar = "█".repeat(Math.min(30, Math.ceil(count / 10)));
    console.log(
      `  ${feat.padEnd(16)} : ${count.toString().padStart(4)} occurrences  ${bar}`,
    );
  }

  if (report.missingKeys.length > 0) {
    console.log("\n❌ Sample Missing Keys:");
    report.missingKeys.slice(0, 10).forEach((k) => {
      console.log(
        `  - [${k.missingIn.toUpperCase()}] \`${k.fullKeyPath}\` in ${k.file}:${k.line}`,
      );
    });
  }

  console.log("\n💡 Tips:");
  console.log(
    "  • Run with --markdown to generate a full Markdown report table.",
  );
  console.log(
    "  • Run with --feature=<name> to focus on a specific feature (e.g. --feature=operator).",
  );
  console.log("  • Run with --json for programmatic inspection.\n");
}
