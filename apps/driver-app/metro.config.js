const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const reactNativeIndexPath = path.join(
	path.dirname(require.resolve("react-native/package.json")),
	"index.js"
);

config.resolver.useWatchman = true;

const cssConfig = withNativeWind(config, {
	input: "./global.css",
	inlineRem: 16,
});

config.resolver.nodeModulesPaths = [path.join(__dirname, "node_modules")];

const cssResolveRequest =
	cssConfig.resolver?.resolveRequest ?? cssConfig.resolver?.resolveRequest;

cssConfig.resolver.resolveRequest = (context, moduleName, platform) => {
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
