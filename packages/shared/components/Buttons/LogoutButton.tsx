import React, { Component } from 'react';
import { Button, Center, HStack, Text } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

var socket: Socket;

class LogoutButton extends Component<{}, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    handleButtonPress() {
        AsyncStorage.removeItem('user');
        // find a way to save the main page if user not logout and delete it if user logout
        socket.emit('logout');
    }

    render() {
        return (
            <HStack space={5} flex={2}>
                <Button colorScheme="info" alignSelf='center' flex={2} onPress={this.handleButtonPress}>
                    <Text bold={true} textAlign='center'>Logout</Text>
                </Button>
            </HStack>
        )
    }
}

export default LogoutButton;