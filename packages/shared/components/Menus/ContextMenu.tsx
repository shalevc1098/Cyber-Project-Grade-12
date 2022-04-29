import React, { Component } from 'react';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';

var socket: Socket;

class ContextMenu extends Component<any, any> {
    constructor(props) {
        super(props);
        socket = globalProps.socket;

        this.state = {
            isVisible: false,
            x: 0,
            y: 0
        };

        this.onContextMenu = this.onContextMenu.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onContextItemClick = this.onContextItemClick.bind(this);
    }

    componentDidMount() {
        document.addEventListener('contextmenu', this.onContextMenu);
        document.addEventListener('click', this.onClick);
        Array.from(document.getElementsByClassName('fileContextMenuItem')).forEach((element) => {
            element.addEventListener('click', this.onContextItemClick);
        });
    }

    componentWillUnmount() {
        this.setState({});
        document.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('click', this.onClick);
        Array.from(document.getElementsByClassName('fileContextMenuItem')).forEach((element) => {
            element.removeEventListener('click', this.onContextItemClick);
        });
    }

    onContextMenu(e) {
        var element = e.srcElement;
        if (element.className != 'file') {
            element = element.parentElement;
            var isInsideFile = false;
            while (element) {
                if (element.className == 'file') {
                    isInsideFile = true;
                    break;
                }
                element = element.parentElement;
            }
            if (!isInsideFile) return;
        }
        e.preventDefault();
        this.setState({ isVisible: true, x: e.clientX, y: e.clientY - 30 });
    }

    onClick(e) {
        if (e.target.id == 'contextMenu') return;
        e.preventDefault();
        if (e.target.className != 'fileContextMenuItem' && this.state.isVisible) this.props.setState({ selectedFiles: [] });
        this.setState({ isVisible: false });
    }

    onContextItemClick(e) {
        this.setState({ isVisible: false });
    }

    render() { // split ContextMenu to one for the client and one for the host (like i did with the Files)
        // set hosts to listViewData (rename the var name mabye)
        return this.state.isVisible ? (
            <div id='fileContextMenu' style={{
                top: this.state.y,
                left: this.state.x - 1,
            }}>
                <p className='fileContextMenuItem' onClick={this.props.downloadFileFromHost}>Download</p> 
            </div>
        ) : null;
    }
}

export default ContextMenu;