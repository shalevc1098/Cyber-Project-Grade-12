import { Text, View } from 'native-base';
import React, { Component } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import globalProps from 'shared/GlobalProps';
import Icon from 'react-native-vector-icons/FontAwesome';

class FileItem extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            hovered: false,
            selected: false
        }
    }

    // change item to file

    render() {
        return (
            <>
                {globalProps.platform == 'Android' ? (
                    <TouchableOpacity style={{
                        borderWidth: this.props.selected ? 1 : undefined,
                        borderStyle: this.props.selected ? 'solid' : undefined,
                        borderColor: 'white'
                    }} key={this.props.file.name} onPress={() => {
                        if (!globalProps.room.isHost && this.props.file.name != '..' && !['storage', 'folder'].includes(this.props.file.type) && this.props.state.selectedFiles.length > 0) {
                            if (this.props.selected) {
                                const fileIndex = this.props.state.selectedFiles.indexOf(this.props.file);
                                const files = this.props.state.selectedFiles;
                                files.splice(fileIndex, 1);
                                this.props.setState({ selectedFiles: files });
                            } else {
                                this.props.setState({ selectedFiles: [...this.props.state.selectedFiles, this.props.file] });
                            }
                        } else {
                            if (globalProps.room.isHost) this.props.onFilePress(this.props.file.name, this.props.file.path);
                            else this.props.onFilePress(this.props.file.name, this.props.file.path, this.props.file.type);
                        }
                    }} onLongPress={() => {
                        if (!globalProps.room.isHost && this.props.file.name != '..' && !['storage', 'folder'].includes(this.props.file.type)) {
                            if (this.props.state.selectedFiles.length == 0) {
                                this.props.setState({ selectedFiles: [this.props.file] });
                            } else {
                                if (this.props.selected) {
                                    const fileIndex = this.props.state.selectedFiles.indexOf(this.props.file);
                                    const files = this.props.state.selectedFiles;
                                    files.splice(fileIndex, 1);
                                    this.props.setState({ selectedFiles: files });
                                    this.setState({ selected: false });
                                } else {
                                    this.props.setState({ selectedFiles: [...this.props.state.selectedFiles, this.props.file] });
                                }
                            }
                        }
                    }}>
                        {this.props.file.type != 'folder' && (
                            <View height={'100%'} alignItems={'center'} justifyContent={'center'} zIndex={1} position={'absolute'} right={0}>
                                <Text>{this.props.file.size && Array.isArray(this.props.file.size) ? `${formatBytes(this.props.file.size[0])}/${formatBytes(this.props.file.size[1])}` : formatBytes(this.props.file.size)}</Text>
                            </View>
                        )}
                        <Text fontSize={25} width={'60%'} numberOfLines={1}>
                            {this.props.file.icon && (this.props.file.icon.type == 'image' && <Image source={{ uri: this.props.file.icon.uri }} style={{ width: this.props.file.icon.width, height: this.props.file.icon.height }} /> || this.props.file.icon.type == 'icon' && <Icon name={this.props.file.icon.name} size={this.props.file.icon.size} />)} {this.props.file.name}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <div className='file' onMouseDown={(e) => {
                        if (!globalProps.room.isHost && e.button == 2 && this.props.file.name != '..' && !['storage', 'folder'].includes(this.props.file.type)) {
                            if (this.props.state.selectedFiles.length == 0) this.props.setState({ selectedFiles: [this.props.file] });
                            else {
                                if (!this.props.state.selectedFiles.some(file => file.path == this.props.file.path)) this.props.setState({ selectedFiles: [...this.props.state.selectedFiles, this.props.file] });
                            }
                        }
                    }} style={{
                        cursor: 'pointer',
                        opacity: this.state.hovered ? 0.5 : 1,
                        borderWidth: 1,
                        borderStyle: this.props.selected ? 'solid' : undefined,
                        borderColor: 'white'
                    }} key={this.props.file.name} onClick={(e) => {
                        if (!globalProps.room.isHost && this.props.file.name != '..' && !['storage', 'folder'].includes(this.props.file.type) && (e.ctrlKey || this.props.state.selectedFiles.length > 0)) {
                            if (this.props.selected) {
                                const fileIndex = this.props.state.selectedFiles.indexOf(this.props.file);
                                const files = this.props.state.selectedFiles;
                                files.splice(fileIndex, 1);
                                this.props.setState({ selectedFiles: files });
                            } else this.props.setState({ selectedFiles: [...this.props.state.selectedFiles, this.props.file] });
                        } else {
                            if (globalProps.room.isHost) this.props.onFilePress(this.props.file.name, this.props.file.path);
                            else this.props.onFilePress(this.props.file.name, this.props.file.path, this.props.file.type);
                        }
                    }}
                        onMouseEnter={() => this.setState({ hovered: true })}
                        onMouseLeave={() => this.setState({ hovered: false })}>
                        {this.props.file.type != 'folder' && (
                            <View height={'100%'} alignItems={'center'} justifyContent={'center'} zIndex={1} position={'absolute'} right={0}>
                                <Text>{this.props.file.size && Array.isArray(this.props.file.size) ? `${formatBytes(this.props.file.size[0])}/${formatBytes(this.props.file.size[1])}` : formatBytes(this.props.file.size)}</Text>
                            </View>
                        )}
                        <Text fontSize={25} width={'60%'} numberOfLines={1}>
                            {this.props.file.icon && (this.props.file.icon.type == 'image' && <Image source={{ uri: this.props.file.icon.uri }} style={{ width: this.props.file.icon.width, height: this.props.file.icon.height }} /> || this.props.file.icon.type == 'icon' && <Icon name={this.props.file.icon.name} size={this.props.file.icon.size} />)} {this.props.file.name}
                        </Text>
                    </div>
                )}
            </>
        )
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default FileItem;