import React, { Component } from 'react';
import { Button, Center, HStack, Text } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';

var socket: Socket;

class CreateRoomButton extends Component<{}, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    handleButtonPress() {
        socketHelpers.emitLocally(socket, 'update page', 'Create Room');
    }

    render() {
        return (
            <HStack space={5} flex={1}>
                <Button colorScheme="info" alignSelf='center' flex={1} onPress={this.handleButtonPress}>
                    <Text bold={true} textAlign='center'>Create Room</Text>
                </Button>
            </HStack>
        )
    }
}

export default CreateRoomButton;