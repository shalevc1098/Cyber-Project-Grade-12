import React, { Component } from 'react';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { AudioPlayer } from 'shared/components';
import Sound from 'react-native-sound'

var socket: Socket;

class AudioPreview extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;
    }

    render() {
        /* TODO: implement android audio player */
        return (
            <>
                {globalProps.platform == 'Android' ? <AudioPlayer path={this.props.path} /> : <audio src={this.props.path} controls={true}></audio>}
            </>
        )
    }
}

export default AudioPreview;