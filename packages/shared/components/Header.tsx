import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Linking } from 'react-native';
import { FormControl, Stack, Input, Button, Text, Center, View } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Header as HeaderRNE } from 'react-native-elements';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

var socket: Socket;

class Header extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;
    }

    // Renders the header content
    render() {
        return (
            <HeaderRNE containerStyle={{ borderBottomWidth: 0 }}>
                <View>

                </View>
                <View>
                    <Text style={{ color: 'white', fontSize: 20 }}>
                        {this.props.user ? `Welcome, ${this.props.user && this.props.user.username}!` : 'Welcome, Guest!'}
                    </Text>
                </View>
                <View>

                </View>
            </HeaderRNE>
        );
    }
}

export default Header;