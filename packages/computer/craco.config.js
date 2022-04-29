const path = require('path');

const webpack = require("webpack");
const { getWebpackTools } = require("react-native-monorepo-tools");

const monorepoWebpackTools = getWebpackTools();

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.externals = {
                ...webpackConfig.externals,
                'react-native-fs': 'fs',
                'react-native-fetch-blob': 'base64-stream'
            }
            webpackConfig.resolve.alias = {
                ...webpackConfig.resolve.alias,
                'react-native-sound': 'howler'
            }
            webpackConfig.module.rules = [
                ...webpackConfig.module.rules,
                {
                    test: /\.ttf$/,
                    loader: "url-loader",
                    include: path.resolve(__dirname, '..', '..', 'node_modules', 'react-native-vector-icons')
                }
            ]
            // Allow importing from external workspaces.
            monorepoWebpackTools.enableWorkspacesResolution(webpackConfig);
            // Ensure nohoisted libraries are resolved from this workspace.
            monorepoWebpackTools.addNohoistAliases(webpackConfig);
            return webpackConfig;
        },
        plugins: [
            // Inject the React Native "__DEV__" global variable.
            new webpack.DefinePlugin({
                __DEV__: process.env.NODE_ENV != "production",
            }),
        ],
    },
    eslint: {
        enable: false,
    },
    babel: {
        presets: [
            "@babel/preset-react"
        ],
        plugins: [
            "@babel/plugin-syntax-jsx"
        ]
    },
};