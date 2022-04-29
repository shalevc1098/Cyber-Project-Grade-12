import React, { Component } from 'react';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Button, HStack, Text, View, VStack } from 'native-base';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Sound from 'react-native-sound';
import path from 'path';

var fs;

try {
    Sound.setCategory('Playback');
    fs = require('react-native-fs');
} catch (error) { }

var socket: Socket;

class AudioPlayer extends Component<any, any> {
    sound: Sound;
    sliderEditing: boolean;
    file: any;
    timeout: any;
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            currentTime: 0,
            totalTime: 0,
            isPlaying: false
        }

        this.sliderEditing = false;

        if (globalProps.room.isHost) {
            const splittedPath = this.props.path.split('/');
            splittedPath.pop();
            const directory = splittedPath.join('/');
            this.sound = new Sound(path.basename(this.props.path), directory, (error) => {
                if (error) return console.log(error);
                this.setState({ totalTime: this.sound.getDuration() });
            });
        }

        this.onSliderEditStart = this.onSliderEditStart.bind(this);
        this.onSliderEditing = this.onSliderEditing.bind(this);
        this.onSliderEditEnd = this.onSliderEditEnd.bind(this);
        this.onSlidingStart = this.onSlidingStart.bind(this);
        this.onSlidingComplete = this.onSlidingComplete.bind(this);
    }

    async componentDidMount() {
        if (!globalProps.room.isHost) {
            await fs.writeFile(`/storage/emulated/0/Documents/temp`, this.props.path, 'base64');
            this.sound = new Sound('temp', '/storage/emulated/0/Documents', (error) => {
                if (error) return console.log(error);
                this.setState({ totalTime: this.sound.getDuration() });
            });
        }

        this.timeout = setInterval(() => {
            if (this.sound && this.sound.isLoaded() && this.sound.isPlaying() && !this.sliderEditing) {
                this.sound.getCurrentTime((seconds) => {
                    this.setState({ currentTime: seconds, totalTime: this.sound.getDuration() });
                });
            }
        }, 100);
    }

    async componentWillUnmount() {
        this.setState({});
        if (this.sound) {
            if (this.sound.isPlaying()) this.sound.stop();
            this.sound.release(); // audio spikes :(
        }
        //if (!globalProps.room.isHost) await fs.unlink(`${fs.TemporaryDirectoryPath}/temp`);
        clearInterval(this.timeout);
    }

    onSliderEditStart() {
        this.sliderEditing = true;
    }

    onSliderEditing(value: number) {
        if (this.sound) {
            const newSeconds = this.state.totalTime * value;
            this.sound.setCurrentTime(newSeconds);
            this.setState({ currentTime: newSeconds });
        }
    }

    onSliderEditEnd() {
        //if (!this.sound.isPlaying() && this.state.isPlaying) this.sound.play();
        this.sliderEditing = false;
    }

    onSlidingStart() {
        this.sliderEditing = true;
    }

    onSlidingComplete(value: number) {
        if (!this.sliderEditing) return;
        if (this.sound) {
            const newSeconds = this.state.totalTime * value;
            this.sound.setCurrentTime(newSeconds);
            this.setState({ currentTime: newSeconds });
        }
        this.sliderEditing = false;
    }

    getAudioTimeString(seconds: number) {
        const h = Math.trunc(seconds / (60 * 60));
        const m = Math.trunc(seconds % (60 * 60) / 60);
        const s = Math.trunc(seconds % 60);

        return ((h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s));
    }

    render() {
        return this.sound && this.sound.isLoaded() ? (
            <>
                <View style={{ padding: 10 }}>
                    <Slider
                        onTouchStart={this.onSliderEditStart}
                        onTouchEnd={this.onSliderEditEnd}
                        onValueChange={this.onSliderEditing}
                        onSlidingStart={this.onSlidingStart}
                        onSlidingComplete={this.onSlidingComplete}
                        value={this.sound && this.sound.isLoaded() ? this.state.currentTime / this.state.totalTime : 0}
                        style={{ marginTop: 230, width: 350 }}
                    />
                    <HStack>
                        <Text marginRight={'auto'}>{this.getAudioTimeString(this.state.currentTime)}</Text>
                        <TouchableOpacity style={styles.playButtonContainer} onPress={() => {
                            if (this.sound.isPlaying()) {
                                this.sound.pause();
                            } else {
                                this.sound.play();
                            }
                            this.setState({ isPlaying: !this.sound.isPlaying() });
                        }}>
                            <Icon name={this.state.isPlaying ? 'pause' : 'play'} />
                        </TouchableOpacity>
                        <Text marginLeft={'auto'}>{this.getAudioTimeString(this.state.totalTime)}</Text>
                    </HStack>
                </View>
            </>
        ) : <></>
    }
}

const styles = StyleSheet.create({
    playButtonContainer: {
        backgroundColor: '#303030',
        borderRadius: 100,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
});

export default AudioPlayer;