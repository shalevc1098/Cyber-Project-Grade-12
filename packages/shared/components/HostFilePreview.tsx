import React, { Component } from 'react';
import { Modal } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Image } from 'react-native';
import { AudioPreview } from 'shared/components';

var socket: Socket;

class HostFilePreview extends Component<any, any> {
    getPreviewState: Function;
    updatePreviewState: Function;
    preview: any;
    styles: any;
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.styles = {
            modalContent: {
                backgroundColor: 'black',
                borderRadius: 35,
                minWidth: globalProps.platform == 'Android' ? 375 : 550,
                minHeight: globalProps.platform == 'Android' ? 325 : 500,
                alignItems: globalProps.platform == 'Computer' ? 'center' : undefined,
                justifyContent: 'center'
            }
        }

        this.getPreviewState = props.getPreviewState;
        this.updatePreviewState = props.updatePreviewState;
    }

    // Nullify "preview" once the app is closed/the preview modal is no longer shown
    componentWillUnmount() {
        this.preview = null;
    }

    // Renders the modal content
    render() {
        switch (this.props.fileType) {
            case 'audio':
                this.preview = <AudioPreview path={this.props.path} />
                break;
            case 'image':
                this.preview = <Image source={{ uri: `file:///${this.props.path}` }} style={{ position: 'absolute', width: globalProps.platform == 'Android' ? 325 : 500, height: globalProps.platform == 'Android' ? 325 : 500, resizeMode: 'contain' }} />
                break;
        }
        return (
            <Modal isOpen={this.props.showPreview} onClose={this.updatePreviewState}>
                <Modal.Content style={this.styles.modalContent}>
                    <Modal.CloseButton borderRadius={35} />
                    {this.preview}
                </Modal.Content>
            </Modal>
        );
    }
}

export default HostFilePreview;