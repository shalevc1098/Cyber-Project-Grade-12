const path = require('path');

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const isDev = require('electron-is-dev');

require("@electron/remote/main").initialize();
const mainRemote = require("@electron/remote/main");

app.commandLine.appendSwitch('lang', 'en-US');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true.toString();

function createWindow() {
    // Create the browser window.
    // TODO: fix circeled shadow around the app that on top of my electron app
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        backgroundColor: '#303030',
        icon: path.resolve(__dirname, 'favicon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            enableRemoteModule: true,
            preload: path.resolve(__dirname, 'preload.tsx')
        },
        frame: false
    });

    mainRemote.enable(win.webContents);

    win.setMenuBarVisibility(true);
    win.setMinimumSize(500, 500);

    // and load the index.html of the app.
    // win.loadFile("index.html");

    win.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`
    );
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle macOS window activate
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

/*ipcMain.handle('request-application-menu', async () => JSON.parse(JSON.stringify(
    Menu.getApplicationMenu(),
    (key, value) => (key !== 'commandsMap' && key !== 'menu') ? value : undefined)
));*/

ipcMain.on('window-minimize', function (event) {
    BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.on('window-maximize', function (event) {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.isMaximized() ? window.unmaximize() : window.maximize();
});

ipcMain.on('window-close', function (event) {
    BrowserWindow.fromWebContents(event.sender).close();
});

ipcMain.on('window-is-maximized', function (event) {
    event.returnValue = BrowserWindow.fromWebContents(event.sender).isMaximized();
});

ipcMain.on('menu-event', (event, commandId) => {
    const menu = Menu.getApplicationMenu();
    const item = getMenuItemByCommandId(commandId, menu);
    item?.click(undefined, BrowserWindow.fromWebContents(event.sender), event.sender);
});

ipcMain.on('set taskbar progress', (event, progress) => {
    BrowserWindow.fromWebContents(event.sender).setProgressBar(progress);
});

const getMenuItemByCommandId = (commandId, menu = Menu.getApplicationMenu()) => {
    let menuItem;
    menu.items.forEach(item => {
        if (item.submenu) {
            const submenuItem = getMenuItemByCommandId(commandId, item.submenu);
            if (submenuItem) menuItem = submenuItem;
        }
        if (item.commandId === commandId) menuItem = item;
    });

    return menuItem;
};