import React, { Component } from 'react';
import { Button, Center, FlatList, HStack, Text, VStack } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import Icon from 'react-native-vector-icons/Ionicons';

var socket: Socket;

class ShowUserListButton extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            isVisible: false
        };

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    componentWillUnmount() {
        this.setState({});
    }

    handleButtonPress() {
        this.setState({ isVisible: !this.state.isVisible });
        this.props.setMainState({ isVisible: !this.state.isVisible });
    }

    render() {
        return (
            <HStack space={1.5}>
                <Button colorScheme="trueGray" size={8} rounded={100} alignSelf='center' onPress={this.handleButtonPress}><Icon name='person' size={20} color={'white'} /></Button>
                <Text alignSelf={'center'}>{!this.state.isVisible ? 'Show User List' : 'Hide User List'}</Text>
            </HStack>
        )
    }
}

export default ShowUserListButton;