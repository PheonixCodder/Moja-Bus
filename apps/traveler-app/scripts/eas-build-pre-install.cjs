/**
 * EAS may run a newer pnpm that only reads settings from pnpm-workspace.yaml.
 * Force a hoisted node_modules layout so React Native native modules
 * (especially reanimated) resolve correctly in the monorepo.
 */
const fs = require("node:fs");
const path = require("node:path");

const workspaceYaml = path.resolve(__dirname, "../../../pnpm-workspace.yaml");
const npmrcPath = path.resolve(__dirname, "../../../.npmrc");

function ensureWorkspaceNodeLinker() {
  if (!fs.existsSync(workspaceYaml)) {
    console.warn("[eas-build-pre-install] pnpm-workspace.yaml not found");
    return;
  }

  const existing = fs.readFileSync(workspaceYaml, "utf8");
  if (/^nodeLinker:\s*hoisted\s*$/m.test(existing)) {
    console.log("[eas-build-pre-install] nodeLinker=hoisted already set in workspace");
    return;
  }

  const next = `${existing.trimEnd()}\nnodeLinker: hoisted\n`;
  fs.writeFileSync(workspaceYaml, next, "utf8");
  console.log("[eas-build-pre-install] Enabled nodeLinker: hoisted in pnpm-workspace.yaml");
}

function ensureNpmrcNodeLinker() {
  const existing = fs.existsSync(npmrcPath)
    ? fs.readFileSync(npmrcPath, "utf8")
    : "";

  if (/^node-linker=hoisted$/m.test(existing)) {
    console.log("[eas-build-pre-install] node-linker=hoisted already set in .npmrc");
    return;
  }

  const next = `${existing.trimEnd()}\nnode-linker=hoisted\n`;
  fs.writeFileSync(npmrcPath, next, "utf8");
  console.log("[eas-build-pre-install] Enabled node-linker=hoisted in .npmrc");
}

ensureWorkspaceNodeLinker();
ensureNpmrcNodeLinker();
