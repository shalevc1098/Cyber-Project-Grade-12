import React, { Component } from 'react';
import { Center, Text, HStack, Stack, ScrollView } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { ClientFiles, DeleteRoomButton, HostFiles, LeaveRoomButton, ShowUserListButton } from 'shared/components';

var socket: Socket;

class Room extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            isVisible: false,
            connectedUsers: []
        };

        this.setState = this.setState.bind(this);
    }

    // Listens to "Room" events once the user entered the this page
    componentDidMount() {
        // The server will emit this event for every client join/leave
        socket.on('update connected users', (connectedUsers) => {
            this.setState({ connectedUsers: connectedUsers });
        });

        /*
            After server restart, the client will send to the server a request to check if the room he was is exist.
            If yes, the client will ask the server to give him the updated user list in the room he is in.
            If no, the nothing happens until the host reconnected
        */
        socket.on('is room exist', (isExist) => {
            if (isExist) socket.emit('get connected users');
        });

        // Once the client pressed on "Leave Room" button, this event will be emitted using socket.io emit locally and the "leave room" event on the server side will be emitted.
        socket.on('leave room', () => {
            globalProps.room = undefined;
            socket.emit('leave room');
        });

        // The server will emit this event for any room error.
        socket.on('room error', (error) => {
            console.log(error);
        });

        socket.emit('is room exist');
    }

    // Clears the state and unlistens to "Room" events once the app is closed/the client left a room/a room was deleted
    componentWillUnmount() {
        this.setState({});
        socket.off('update connected users');
        socket.off('is room exist');
        socket.off('leave room');
        socket.off('room error');
    }

    // Renders the page content
    render() {
        /* TODO:
                1. update the list of connected users on client join
                2. instead of getting the host files locally, make him send them to you
                3. think if the component should be rendered on the client side or on the host side
                4. implement files upload from client to host
                5. implement files download from host to client
                6. implement files create from client to host
                7. implement files reanme from client to host
                8. implement files open from client to host
                9. implement files delete from client to host
                10. implement auto files update from host to client
                11. implement delete room kicks all the clients from the room
                12. implement chat
                13. dark the app by 50% and block clicks when the user list is showen, except the buttons area and the list itself,
                    and when clicking on the dark area or on the hide user list button, light the app by 50%
        */
        return (
            <>
                <Stack p={5} space={5} style={{ borderBottomColor: 'gray', borderBottomWidth: 1 }}>
                    <Center>
                        <HStack space={5}>
                            {globalProps.room.isHost ? <DeleteRoomButton /> : <LeaveRoomButton />}
                        </HStack>
                    </Center>
                    <HStack position={'absolute'} bottom={2} left={2}>
                        <ShowUserListButton setMainState={this.setState} />
                    </HStack>
                </Stack>
                {this.state.isVisible ? (
                    <ScrollView position={'absolute'} top={globalProps.platform == 'Android' ? 202 : 148} left={0} zIndex={1} backgroundColor={'dark.100'} bottom={-2} contentContainerStyle={{ width: 50 }}>
                        {this.state.connectedUsers.map((username, index) => (
                            <Text key={username} style={{ alignSelf: 'stretch', fontSize: 16, borderBottomColor: 'gray', borderBottomWidth: 1, paddingLeft: 2 }}>{username}</Text>
                        ))}
                    </ScrollView>
                ) : null}
                {globalProps.room && globalProps.room.isHost ? <HostFiles user={this.props.user} /> : <ClientFiles user={this.props.user} />}
            </>
        )
    }
}

export default Room;