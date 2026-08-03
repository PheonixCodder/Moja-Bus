const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const reactNativeIndexPath = path.join(
	path.dirname(require.resolve("react-native/package.json")),
	"index.js"
);

// Expo 57 defaults `useWatchman` to null, forcing Metro's fallback watcher,
// which walks the entire monorepo tree (including the pnpm store) and creates
// an fs.watch handle per directory. On Windows with a large workspace that
// exceeds Metro's watcher-start timeout. Watchman is installed and warm, so
// opt back into it explicitly.
config.resolver.useWatchman = true;

const cssConfig = withNativeWind(config, {
	input: "./global.css",
	inlineRem: 16,
});

// Sandbox module resolution to this app's own node_modules so Metro can never
// climb up to the monorepo root pool, which hoists real SDK-54 copies of native
// modules (async-storage 3.1.1, reanimated 4.1.7, screens 4.16.0, expo 54,
// babel-preset-expo 54, @react-native/codegen 0.81.5) that break the SDK-57
// bundle/runtime. The app's own tree resolves every dependency correctly.
config.resolver.nodeModulesPaths = [path.join(__dirname, "node_modules")];

const cssResolveRequest =
	cssConfig.resolver?.resolveRequest ?? cssConfig.resolver?.resolveRequest;

cssConfig.resolver.resolveRequest = (context, moduleName, platform) => {
	// react-native-css's `components` index lazily re-exports the real
	// react-native through `require("react-native")` getters. A resolver
	// remap of the bare `react-native` specifier can point that require back
	// at the components index itself, producing an infinite `get NativeModules`
	// recursion at startup. Always resolve to the real react-native entry for
	// origins inside react-native-css.
	if (
		moduleName === "react-native" &&
		context.originModulePath &&
		context.originModulePath.includes("react-native-css")
	) {
		return { type: "sourceFile", filePath: reactNativeIndexPath };
	}
	return cssResolveRequest(context, moduleName, platform);
};

module.exports = cssConfig;
