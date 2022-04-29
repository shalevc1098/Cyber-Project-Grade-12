import React, { Component } from 'react';
import { Button, Center, HStack, Text } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';

var socket: Socket;

class DeleteRoomButton extends Component<{}, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    handleButtonPress() {
        socket.emit('delete room');
    }

    render() {
        return (
            <Button colorScheme="info" width='150px' alignSelf='center' onPress={this.handleButtonPress}>
               <Text bold={true} textAlign='center'>Delete Room</Text>
            </Button>
        );
    }
}

export default DeleteRoomButton;