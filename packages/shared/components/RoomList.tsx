import React, { Component } from 'react';
import { Input, Button, Text, View, HStack, Box, Pressable, Spacer, Modal, VStack } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import { SwipeListView, } from 'react-native-swipe-list-view';
import { Dimensions } from 'react-native';

var socket: Socket;

class RoomList extends Component<{}, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            roomList: [],
            roomId: null,
            roomPassword: null,
            noRooms: null
        }

        this.onPasswordTextChange = this.onPasswordTextChange.bind(this);
    }

    // Listens to "RoomList" events once the client entered the this page
    componentDidMount() {
        // The server emits this event with the updated room list and an update to the state occur.
        socket.on('room list', (rooms) => {
            this.setState({ roomList: rooms, noRooms: rooms.length <= 0 });
        });

        // For every room created/deleted, the server will emit this event for all the clients who are on the "RoomList" page
        socket.on('update room list', () => {
            socket.emit('get room list');
        });

        // The server will send the room data if the room password was correct
        socket.on('room data', (data) => {
            globalProps.room = data;
            socketHelpers.emitLocally(socket, 'reload app');
        });

        // The server will emit this event if the entered room password was incorrect
        socket.on('incorrect room password', () => {
            alert('The password you entered is incorrect!');
        });

        // The server will emit this event for any other error while joining a room
        socket.on('room error', (error) => {
            console.log(error);
        });

        // There is an event in the Computer App.tsx file which sends the window dimensions on resize
        if (globalProps.platform == 'Computer') {
            socket.on('update dimensions', (dimensions) => {
                this.setState({ width: dimensions.width, height: dimensions.height });
            });
        }

        socket.emit('get room list');
    }

    // Clears the state and unlistens to "RoomList" events once the app is closed/the client joined a room
    componentWillUnmount() {
        this.setState({});
        socket.off('room list');
        socket.off('update room list');
        socket.off('room data');
        socket.off('incorrect room password');
        socket.off('room error');
        // There is an event in the Computer App.tsx file which sends the window dimensions on resize and updates them accordingly
        if (globalProps.platform == 'Computer') {
            socket.off('update dimensions');
        }
    }

    // On room box press, updated the "roomId" state accordingly and shows a modal that asks for the room password
    onRoomPress(roomId) {
        this.setState({ roomId });
    }

    // On room password input text change, updates the "roomPassword" state accordingly
    onPasswordTextChange(text) {
        this.setState({ roomPassword: text });
    }

    /*
        Once the client pressed on the "Join" button, checks if the entered password is empty.
        If it is, an alert is pop-up that says "Please enter a password!".
        If it isn't, the password will be sent to the server for verification purposes.
    */
    joinRoom() {
        if (!this.state.roomPassword || this.state.roomPassword == '') return alert('Please enter a password!');
        socket.emit('join room', this.state.roomId, this.state.roomPassword);
    }

    // Renders the page content
    render() {
        var index = 0;
        return (
            <>
                {this.state.noRooms != null ? !this.state.noRooms ? (
                    <>
                        <SwipeListView
                            data={this.state.roomList}
                            renderItem={(data: any) => (
                                <Pressable onPress={() => this.onRoomPress(data.item.id)} mx={5} my={index == 0 ? 4 : 0}>
                                    {({ isHovered, isFocused, isPressed }) => {
                                        index++;
                                        return (
                                            <Box bg={isPressed ? "#000000" : isHovered ? "#101010" : "#151515"} p="5" rounded="8">
                                                <HStack alignItems="flex-start">
                                                    <Text fontSize={12} color="dark.900" fontWeight="medium">
                                                        {data.item.id}
                                                    </Text>
                                                    <Spacer />
                                                    <Text fontSize={10} color="dark.800">
                                                        {data.item.roomCreationDate}
                                                    </Text>
                                                </HStack>
                                                <Text color="dark.900" fontWeight="medium" fontSize={20}>
                                                    {data.item.roomName}
                                                </Text>
                                                <Text fontSize={14} color="dark.800">
                                                    {data.item.roomDescription}
                                                </Text>
                                            </Box>
                                        )
                                    }}
                                </Pressable>
                            )}
                            contentContainerStyle={{ marginLeft: 2 }}>
                        </SwipeListView>
                        <Modal avoidKeyboard={true} _backdrop={{ height: globalProps.platform == 'Computer' ? this.state.height - 30 : undefined }} isOpen={this.state.roomId != null} onClose={() => this.setState({ roomId: null })} height={globalProps.platform == 'Computer' ? this.state.height - 30 : undefined} size={'md'}>
                            <Modal.Content backgroundColor={'#383838'}>
                                <Modal.CloseButton />
                                <Modal.Header>Enter room password</Modal.Header>
                                <Modal.Body>
                                    <VStack space={2}>
                                        <Input placeholder='Password' onChangeText={this.onPasswordTextChange} onEndEditing={() => this.joinRoom()}></Input>
                                        <Button width={100} onPress={() => this.joinRoom()} alignSelf={'center'}>Join</Button>
                                    </VStack>
                                </Modal.Body>
                            </Modal.Content>
                        </Modal>
                    </>
                ) : <View style={{ height: this.state.height - 158, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: globalProps.platform == 'Computer' ? 34 : 22 }}>There are no rooms at the moment!</Text></View> : <></>}
            </>
        )
    }
}

export default RoomList;