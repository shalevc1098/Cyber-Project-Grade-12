import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import { NativeBaseProvider, extendTheme } from 'native-base';

const FontAwesome = require('./fonts/FontAwesome.ttf');
const Ionicons = require('./fonts/Ionicons.ttf');
const iconFontStyles = `
@font-face {
        src: url(${FontAwesome});
        font-family: FontAwesome;
    }

@font-face {
        src: url(${Ionicons});
        font-family: Ionicons;
    }
`;

const style = document.createElement('style');
style.type = 'text/css';
if (style.style) {
    style.innerHTML = iconFontStyles;
} else {
    style.innerHTML = iconFontStyles;
}

document.head.appendChild(style);

const themeConfig = {
    useSystemColorMode: false,
    initialColorMode: 'dark'
};

const customTheme = extendTheme({ config: themeConfig });

ReactDOM.render(
    <NativeBaseProvider theme={customTheme}>
        <App />
    </NativeBaseProvider>, document.getElementById('root')
);