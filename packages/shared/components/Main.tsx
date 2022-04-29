import React, { Component } from 'react';
import { FormControl, Stack, Input, Center, Text, View, Container, HStack } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import { CreateRoom, RoomList, CreateRoomButton, LogoutButton, RoomListButton } from 'shared/components';
import { SwipeListView, } from 'react-native-swipe-list-view';
import { TouchableOpacity, Dimensions } from 'react-native';

var socket: Socket;

class Main extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            page: <RoomList />
        };
    }

    // Listens to "Main" events once the user entered the this page
    componentDidMount() {
        // Using socket.io to emit this event locally to check what page to render accordingly
        socket.on('update page', (page) => {
            if (page == 'Create Room') this.setState({ page: <CreateRoom /> });
            else if (page == 'Room List') this.setState({ page: <RoomList /> });
        });
    }

    // Clears the state once the app is closed/the page is unrendered
    componentWillUnmount() {
        this.setState({});
        socket.off('update page');
    }

    // Renders the page content
    render() {
        return (
            <>
                <Center p={5} style={{ borderBottomColor: 'gray', borderBottomWidth: 1 }}>
                    <HStack space={5} style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center'
                    }}>
                        <RoomListButton />
                        <LogoutButton />
                        <CreateRoomButton />
                    </HStack>
                </Center>
                {this.state.page}
            </>
        )
    }
}

export default Main;