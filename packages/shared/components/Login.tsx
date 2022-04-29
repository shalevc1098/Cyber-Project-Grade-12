import React, { Component } from 'react';
import { FormControl, Stack, Input, Button, Box, View, ScrollView } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

var socket: Socket;

const inputNames = ['username', 'password'];

class Login extends Component<{}, any> {
    fields: Map<any, any>;
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.fields = new Map();

        this.state = {
            username: '',
            password: '',
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            errorInputs: []
        }

        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    // Listens to "Login" events once the client entered this page
    componentDidMount() {
        // The server will send the user data if the login was successful
        socket.on('user data', async (data) => {
            await AsyncStorage.setItem('user', JSON.stringify(data));
            socketHelpers.emitLocally(socket, 'reload app'); // Emits the reload app event that's located in the App.tsx file to reload the app
        });

        // The server will send the inputs which has an error in it (if there are)
        socket.on('login error', (errorInput) => {
            this.setState({ errorInputs: [errorInput] });
        });

        // There is an event in the Computer App.tsx file which sends the window dimensions on resize
        if (globalProps.platform == 'Computer') {
            socket.on('update dimensions', (dimensions) => {
                this.setState({ width: dimensions.width, height: dimensions.height });
            });
        }
    }

    // Clears the state and unlistens to "Login" events once the app is closed/the client logged into an account
    componentWillUnmount() {
        this.setState({});
        socket.off('user data');
        socket.off('login error');
        // There is an event in the Computer App.tsx file which sends the window dimensions on resize and updates them accordingly
        if (globalProps.platform == 'Computer') {
            socket.off('update dimensions');
        }
    }

    // Checks which input has changed and updates the state accordingly
    handleTextChange(e) {
        var type;
        var text;
        if (globalProps.platform == 'Android') {
            type = this.fields.get(e.nativeEvent.target);
            text = e.nativeEvent.text;
        }
        else if (globalProps.platform == 'Computer') {
            type = e.target.parentNode.textContent.replace(':', '').toLowerCase();
            text = e.target.value;
        }
        this.setState({ ...this.state, [type]: text });
    }

    /*
        Once the "Login" button pressed, checks if there are no empty inputs.
        If there are, it marks all of the empty ones with red color.
        If there aren't, it sends the data to the server for verification purposes.
    */
    handleButtonPress() {
        const data: Array<any> = [];
        const errorInputs: Array<any> = [];
        for (const inputName of inputNames) {
            if (!this.state[inputName]) errorInputs.push(inputName);
            else data.push(this.state[inputName]);
        }
        this.setState({ errorInputs });
        if (errorInputs.length > 0) return;
        socket.emit('login', ...data);
    }

    // Renders the page content
    render() {
        // Setup inputs from the inputNames array
        const inputs: Array<unknown> = [];
        for (const inputName of inputNames) {
            inputs.push(
                <FormControl key={inputName} isInvalid={this.state.errorInputs.includes(inputName)}>
                    <FormControl.Label marginLeft='0.5'>{inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1').trim()}:</FormControl.Label>
                    <Input variant="underlined" p={globalProps.platform == 'Android' ? 2 : 5} ref={(c: any) => {
                        if (globalProps.platform == 'Android' && c != null) {
                            if (!this.fields.has(c._nativeTag)) {
                                this.fields.set(c._nativeTag, inputName);
                            }
                        }
                    }} onChange={this.handleTextChange} autoCapitalize='none' secureTextEntry={inputName == 'password'} />
                </FormControl>
            );
        }
        return (
            <>
                <View p={5} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ScrollView
                        backgroundColor={'dark.50'}
                        rounded={8}
                        shadow={5}
                        width={'100%'}
                        height={globalProps.platform == 'Computer' ? this.state.height - 198 : undefined}
                        p={5}
                        contentContainerStyle={{ paddingBottom: globalProps.platform == 'Android' ? 39 : 0, minHeight: '100%' }}
                    >
                        <View p={5} style={{ flex: 1, minHeight: '100%', justifyContent: 'space-evenly' }}>
                            {inputs}
                            <Button marginTop={6} backgroundColor={'gray.500'} width='150px' alignSelf='center' onPress={this.handleButtonPress} shadow='5'>Login</Button>
                        </View>
                    </ScrollView>
                </View>
            </>
        )
    }
}

export default Login;