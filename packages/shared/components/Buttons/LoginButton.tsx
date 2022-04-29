import React, { Component } from 'react';
import { Button, Center, HStack, Text } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';

var socket: Socket;

class LoginButton extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;
    }

    render() {
        return (
            <HStack space={5} flex={1}>
                <Button colorScheme="info" flex={1} onPress={this.props.handleButtonPress}>
                    <Text bold={true} textAlign='center'>Login</Text>
                </Button>
            </HStack>
        );
    }
}

export default LoginButton;