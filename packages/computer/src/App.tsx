import React, { Component } from 'react';
import { Authorization, Header, Main, Room } from 'shared/components';
import io from 'shared/classes/Socket';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Text } from 'native-base';
import { Dimensions } from 'react-native';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from 'shared/config';

var socket: Socket;

window.addEventListener('resize', () => {
    try {
        const dimensions = Dimensions.get('window');
        socketHelpers.emitLocally(socket, 'update dimensions', dimensions);
    } catch (error) {
        //console.log(error);
    }
});

class App extends Component<{}, any> {
    user: any;
    constructor(props) {
        super(props);
        globalProps.platform = 'Computer';

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
            <>{jsx}</>
        )
    }
}

export default App;