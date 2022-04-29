module.exports = {
    preset: 'react-native',
    moduleFileExtensions: ['css', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        ".+\\.(css|styl|less|sass|scss)$": "../../node_modules/react-native-css-transformer"
    }
};
