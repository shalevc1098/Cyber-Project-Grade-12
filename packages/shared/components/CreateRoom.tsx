import React, { Component } from 'react';
import { FormControl, Stack, Input, Button, KeyboardAvoidingView, ScrollView, Select, View, Text, Box } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import * as socketHelpers from 'shared/helpers/socketHelpers';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Dimensions } from 'react-native';

var socket: Socket;

const inputNames = ['roomName', 'roomPassword', 'roomDescription', 'maxUsers'];

class CreateRoom extends Component<{}, any> {
    fields: Map<any, any>;
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            roomName: null,
            roomPassword: null,
            roomDescription: null,
            maxUsers: null,
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            errorInputs: []
        }

        this.fields = new Map();

        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonPress = this.handleButtonPress.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
    }

    // Listens to "CreateRoom" events once the client entered the this page
    componentDidMount() {
        // The server will send this event if the room was successfully created
        socket.on('room data', (data) => {
            globalProps.room = data;
            socketHelpers.emitLocally(socket, 'reload app');
        });

        // The server will emit this event if the room was unsuccessfully created
        socket.on('room error', (error) => {
            console.log(error);
        });

        // There is an event in the Computer App.tsx file which sends the window dimensions on resize and updates them accordingly
        if (globalProps.platform == 'Computer') {
            socket.on('update dimensions', (dimensions) => {
                this.setState({ width: dimensions.width, height: dimensions.height });
            });
        }
    }

    // Clears the state and unlistens to "CreateRoom" events once the app is closed/the client created a room
    componentWillUnmount() {
        this.setState({});
        socket.off('room data');
        socket.off('room error');
        if (globalProps.platform == 'Computer') {
            socket.off('update dimensions');
        }
    }

    // Checks which input has changed except "maxUsers" and updates the state accordingly
    handleTextChange(e) {
        var type;
        var text;
        if (globalProps.platform == 'Android') {
            type = this.fields.get(e.nativeEvent.target);
            text = e.nativeEvent.text;
        } else if (globalProps.platform == 'Computer') {
            const typeName = e.target.parentNode.textContent;
            type = typeName.charAt(0).toLowerCase() + typeName.slice(1).replace(':', '').replace(' ', '');
            text = e.target.value;
        }
        this.setState({ ...this.state, [type]: text });
    }

    // Once the "maxUsers" input has changed, updates the "maxUsers" state accordingly
    handleValueChange(value) {
        this.setState({ maxUsers: value });
    }

    /*
        Once the "CreateRoom" button pressed, checks if there are no empty inputs.
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
        socket.emit('create room', ...data);
    }

    // Renders the page content
    render() {
        // Setup inputs from the inputNames array
        const inputs: Array<unknown> = [];
        for (const inputName of inputNames) {
            inputs.push(
                <FormControl key={inputName} isInvalid={this.state.errorInputs.includes(inputName)}>
                    <FormControl.Label marginLeft='0.5'>{inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1').trim()}:</FormControl.Label>
                    {inputName != 'maxUsers' ? (
                        <Input variant='underlined' p={globalProps.platform == 'Android' ? 2 : 5} ref={(c: any) => {
                            if (globalProps.platform == 'Android' && c != null) {
                                if (!this.fields.has(c._nativeTag)) {
                                    this.fields.set(c._nativeTag, inputName);
                                }
                            }
                        }} onChange={this.handleTextChange} autoCapitalize='none' secureTextEntry={inputName == 'roomPassword'} />
                    ) : (
                        <Select variant="underlined" placeholder='Choose the maximum number of users (+You) that can enter the room' p={globalProps.platform == 'Android' ? 2 : 5} onValueChange={this.handleValueChange}>
                            <Select.Item label="1" value="1" />
                            <Select.Item label="2" value="2" />
                            <Select.Item label="3" value="3" />
                            <Select.Item label="4" value="4" />
                        </Select>
                    )}
                </FormControl>
            );
        }
        // "Create" button marginTop value for Computer
        return (
            <>
                <View p={5} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ScrollView
                        backgroundColor={'dark.50'}
                        rounded={8}
                        shadow={5}
                        width={'100%'}
                        height={globalProps.platform == 'Computer' ? this.state.height - 200 : undefined}
                        p={5}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: globalProps.platform == 'Android' ? 39 : 0, minHeight: '100%' }}
                    >
                        <View p={5} style={{ flex: 1, minHeight: '100%', justifyContent: 'space-around' }}>
                            {inputs}
                            <Button marginTop={globalProps.platform == 'Android' ? 5 : 9} backgroundColor={'gray.500'} width='150px' alignSelf='center' onPress={this.handleButtonPress} shadow='5'>Create</Button>
                        </View>
                    </ScrollView>
                </View>
            </>
        )
    }
}

export default CreateRoom;