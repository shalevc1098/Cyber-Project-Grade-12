import React, { Component } from 'react';
import { Button, Center, HStack, Text } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';

var socket: Socket;

class LeaveRoomButton extends Component<{}, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    handleButtonPress() {
        socketHelpers.emitLocally(socket, 'leave room'); // change this to remove user from streams map
    }

    render() {
        return (
            <Button colorScheme="info" width='150px' alignSelf='center' onPress={this.handleButtonPress}>
                <Text bold={true} textAlign='center'>Leave Room</Text>
            </Button>
        );
    }
}

export default LeaveRoomButton;