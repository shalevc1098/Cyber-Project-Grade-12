import React, { Component } from 'react';
import { NativeBaseProvider, extendTheme, Text, Toast } from 'native-base';
import { Authorization, Header, Main, Room } from 'shared/components';
import io from 'shared/classes/Socket';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { BackHandler, LogBox, PermissionsAndroid, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';
import config from 'shared/config';
import * as AndroidFs from 'shared/functions/Android/AndroidFs';
import DocumentPicker from 'react-native-document-picker';

// uninstall react-native-safe-area-context if it is not in use

LogBox.ignoreLogs(['Require cycle:', '`new NativeEventEmitter()`']);

//const styles = require("./styles.css");

var socket: Socket;

const themeConfig = {
    useSystemColorMode: false,
    initialColorMode: 'dark',
};

var watcher

(async () => {
    try {
        //const path = '/storage/emulated/0/';
        //watcher = await AndroidFs.watch(path, async (event, file) => {
        //    console.log('a change occured!', { file, event });
        //}); // here, i creating the watcher and telling it to watch changes in the internal storage and logging the change and the file
        //await fs.writeFile('/storage/emulated/0/Download/test.txt', 'The best file ever :)'); // file is created
        //await fs.unlink('/storage/emulated/0/Download/test.txt'); // file is deleted
        //await watcher.close().then(console.log); // stopping to watch the directory and console log the result to be sure that the watcher is really stopped
        //await fs.writeFile('/storage/emulated/0/Download/test.txt', 'The best file ever :)'); // file is created
        //await fs.unlink('/storage/emulated/0/Download/test.txt'); // file is deleted
        // i recreating the test.txt and redeleating it to check if the watcher is stopped completely
        // now you must make new watcher to watch again :)
        
        /*const dir = await DocumentPicker.pickSingle();
        if (!dir) return;
        const uri = dir.uri;
        await AndroidFs.uriToPath(uri);*/
    } catch (error) {
        console.log(error);
    }
})();

const customTheme = extendTheme({ config: themeConfig });

//NativeModules.AndroidFs.on('one', (number) => console.log(number));

class App extends Component<{}, any> {
    user: any;
    constructor(props) {
        super(props);
        globalProps.platform = 'Android';

        this.state = {
            connected: false
        }
    }

    async initSocket() {
        if (!globalProps.socket) {
            globalProps.socket = await new io(config.server.ip, config.server.port, "http").connect();
            socket = globalProps.socket;
        }

        if (!socket) return;

        try {
            this.user = await AsyncStorage.getItem('user');

            socket.io.on('reconnect', () => {
                socket.emit('client is ready');
            });

            socket.on('disconnect', () => {
                this.setState({ connected: false });
            });

            socket.on('set data', () => {
                if (this.user) {
                    socket.emit('set data', 'user', this.user);
                    return;
                }
                this.setState({ connected: true });
            });

            // do this also on the mobile App.tsx
            // fix the connected state

            socket.on('reload app', async () => {
                this.user = await AsyncStorage.getItem('user');
                if (!this.user) {
                    globalProps.user = undefined;
                    globalProps.room = undefined;
                    socket.emit('logout');
                }
                this.forceUpdate();
            });

            socket.on('incorrect data', async (key, error) => {
                if (key == 'user') {
                    await AsyncStorage.removeItem(key);
                    this.user = null;
                } else if (key == 'room') globalProps[key] = undefined;
                console.log(error);
                this.setState({ connected: true });
            });

            socket.on('check if client was in room before reload', () => {
                if (globalProps.room) {
                    socket.emit('set data', 'room', globalProps.room);
                    return;
                }
                this.setState({ connected: true });
            });

            socket.on('ask the client to emit add room event', () => {
                socket.emit('add room');
            });

            socket.on('update connected state to true', () => {
                this.setState({ connected: true });
            });

            socket.on('host ready', () => {
                socket.emit('join room', globalProps.room.id, globalProps.room.roomPassword);
            });

            socket.emit('client is ready');
        } catch (error) {
            console.log(error);
        }
    }

    async componentDidMount() {
        this.initSocket();
        SplashScreen.hide();
        const permissionManageExternalStorage = async () => {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
            ]);
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE) && await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            return granted;
        };

        const permissionGranted = await permissionManageExternalStorage();
        if (permissionGranted) {
            if (!(await NativeModules.ManageStorage.isExternalStorageManager())) {
                NativeModules.ManageStorage.RequestPermission();
            }
        } else {
            if (!permissionGranted) {
                Toast.show({
                    description: 'Permission to access storage is required to use this app.',
                });
                BackHandler.exitApp();
            }
        }
    }

    async componentWillUnmount() {
        this.setState({});
        if (socket) socket.disconnect();
        if (globalProps.socket) delete globalProps.socket;
    }

    render() {
        var jsx = <Text> Connecting to the server...</Text>;
        try {
            if (this.state.connected) {
                if (this.user) {
                    if (globalProps.room) {
                        jsx = <><Header user={JSON.parse(this.user)} /><Room user={JSON.parse(this.user)} /></>;
                    } else {
                        jsx = <><Header user={JSON.parse(this.user)} /><Main user={JSON.parse(this.user)} /></>;
                    }
                } else {
                    jsx = <><Header /><Authorization /></>;
                }
            }
        } catch (error) {
            console.log(error);
        }

        return (
            <NativeBaseProvider theme={customTheme}>
                {jsx}
            </NativeBaseProvider>
        )
    }
}

export default App;