const { dialog } = require('@electron/remote');
window['electron'] = {};
window['electron'].dialog = dialog;

// 1. Require the installed module
const { ipcRenderer } = require('electron');
const customTitleBar = require('custom-electron-titlebar');

// 2. Create the custom titlebar with your own settings
//    To make it work, we just need to provide the backgroundColor property
//    Other properties are optional.

var titleBar;

window.addEventListener('DOMContentLoaded', () => {
    titleBar = new customTitleBar.Titlebar({
        backgroundColor: customTitleBar.Color.fromHex("#303030"),
        shadow: true,
        titleHorizontalAlignment: 'left',
        onMinimize: () => ipcRenderer.send('window-minimize'),
        onMaximize: () => ipcRenderer.send('window-maximize'),
        onClose: () => ipcRenderer.send('window-close'),
        isMaximized: () => ipcRenderer.sendSync('window-is-maximized'),
        onMenuItemClick: (commandId) => ipcRenderer.send('menu-event', commandId)  // Add this for click action
    });

    titleBar.updateMenu();
});