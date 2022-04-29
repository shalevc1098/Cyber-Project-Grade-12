const path = require("path");
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
    const {
        resolver: { sourceExts }
    } = await getDefaultConfig();
    return {
        projectRoot: path.resolve(__dirname, "../../"),
        transformer: {
            babelTransformerPath: require.resolve("react-native-css-transformer")
        },
        resolver: {
            sourceExts: [...sourceExts, "css"]
        },
        alias: {
            fs: require.resolve('../../node_modules/react-native-fs')
        },
        watchFolders: [path.resolve(__dirname)]
    };
})();