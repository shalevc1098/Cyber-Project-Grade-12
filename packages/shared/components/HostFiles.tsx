import React, { Component } from 'react';
import { View, Toast } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Dimensions, BackHandler } from 'react-native';
import path from 'path';
import mime from 'mime-types';
import FilePreview from './HostFilePreview';
import * as AndroidFs from 'shared/functions/Android/AndroidFs';
import BigList from 'react-native-big-list';
import FileItem from 'shared/components/FileItem';

var fs;
var fsFunctions;

try {
    fs = require('react-native-fs');
    fsFunctions = require('shared/functions/Android/FS');
} catch (error) {
    fs = window.require('fs');
    fsFunctions = require('shared/functions/Computer/FS');
}

var socket: Socket;

const filePreviewTypes = ['audio', 'image'];

// TODO: add an ability to ctrl + f on the computer and a button with search icon on both to search file

class HostFiles extends Component<any, any> {
    updateFilesLoop: any;
    readStreams: Array<any>;
    streams: Map<any, any>;
    cachedImages: Map<any, any> = new Map();
    cachedDirectories: Map<any, any> = new Map();
    flatListViewRef;
    constructor(props) {
        // Required to allow the use of props (for example, <HostFiles name="Shalev" age={18} />)
        super(props);
        // Declares the socket from the globalProps to a socket variable for simple use
        socket = globalProps.socket;

        // Initializes the state sections
        this.state = {
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            files: [],
            fileType: null,
            showPreview: false,
            path: null,
            previousPath: null,
            renderLongPress: false,
            longX: 0,
            longY: 0,
            filePath: null,
            progress: 0,
            renderProgress: false
        }

        this.streams = new Map();

        // Binds some function so I can use them as "{this.functionName}" instead of "{() => this.functionName(...)}"
        this.getPreviewState = this.getPreviewState.bind(this);
        this.updatePreviewState = this.updatePreviewState.bind(this);
        this.setState = this.setState.bind(this);
        this.renderFileList = this.renderFileList.bind(this);
        this.onFilePress = this.onFilePress.bind(this);
        //this.scrollToFirstJfif = this.scrollToFirstJfif.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
    }

    // Listens to "HostFiles" events once the client entered the this page
    async componentDidMount() {
        // Gets the available storages host-sided
        this.getStorages();

        // This event emits when a client requests the room host storages
        socket.on('get storages', async (clientId) => {
            const storages = await fsFunctions.getStorages();
            socket.emit('host storages', clientId, storages);
        });

        // This event emits when a client requests the room host files in some path
        socket.on('get files', async (clientId, previousPath, dirPath) => {
            try {
                const files = await fsFunctions.readDirectory(previousPath, dirPath, this.cachedImages);
                socket.emit('host files', clientId, files, previousPath, dirPath);
            } catch (error) {
                socket.emit('show permission denied toast', clientId);
            }
        });

        // This event emits once the client requested to download a file from the host
        socket.on('start sending file to client', async (clientId, fileName, filePath, savePath, bufferSize) => {
            try {
                var readStream;

                // Checks if the streams map contains the client id and if not adds it
                if (!this.streams.has(clientId)) await this.addClientToStreamsMap(clientId);

                // Checks the platform and setup readStream accordingly
                if (globalProps.platform == 'Android') {
                    // Creates the readStream with bufferSize of "5242880" bytes
                    readStream = AndroidFs.createReadStream(filePath, {
                        highWaterMark: bufferSize
                    });

                    // Adds the readStream to the read streams list
                    this.streams.get(clientId).read.set(savePath, readStream);

                    // This event emits if there are any chunks to read from the file by calling "readStream.read()"
                    readStream.on('data', (chunk) => {
                        socket.emit('host file chunk', clientId, chunk, savePath);
                    });
                } else if (globalProps.platform == 'Computer') {
                    // Creates the readStream with encoding of "base64" and bufferSize of "5242880" bytes
                    readStream = fs.createReadStream(filePath, {
                        encoding: 'base64',
                        highWaterMark: bufferSize
                    });

                    // This event emits if there are any errors while reading the file
                    readStream.on('error', async (e) => {
                        // Destroys the readStream, tells the client to destroy his write stream and updates him that there was an error while downloading the file
                        await this.destroyReadStream(clientId, savePath, true);
                        // Throws an error which says "There was an error while sending ${fileName} to the client!" (fileName is the name of the file)
                        throw new Error(`There was an error while sending ${fileName} to the client!`);
                    });

                    // Adds the readStream to the read streams list
                    this.streams.get(clientId).read.set(savePath, readStream);

                    // Gets the stats of the file by its path
                    const fileStats = fs.lstatSync(filePath);

                    // This event emits if there are any chunks to read from the file
                    readStream.on('data', async (chunk) => {
                        // Sends the file chunk to the client
                        socket.emit('host file chunk', clientId, chunk, savePath);
                        // Prevents pause of the readStream if its not readable or this is the last chunk to read
                        if (!readStream.readable || fileStats.size <= bufferSize) return;
                        // Pauses the read of the file until the client gets the file chunk
                        readStream.pause();
                    });
                }

                // This event emits once the read of the file is over
                readStream.on('end', async () => {
                    // Destroys the readStream
                    await this.destroyReadStream(clientId, savePath, false);
                    // Informs the client that the file was successfully downloaded
                    socket.emit('host file downloaded', clientId, savePath);
                });

                // For Android you have to start reading from the readStream manually
                if (globalProps.platform == 'Android') readStream.read();
            } catch (error) {
                // Checks if the platform is equals to "Android"
                if (globalProps.platform == 'Android') {
                    // Removes the readStream from the read streams list
                    this.streams.get(clientId).read.delete(savePath);
                    try {
                        // Destroys the readStream
                        readStream.destroy();
                    } catch (error) { }
                    // Cancels the download client-sided
                    socket.emit('download cancelled', clientId, savePath);
                }
            }
        });

        // The client emits this event when he successfully read the file chunk and ready to get the next one
        socket.on('client is ready to get the next file chunk', (clientId, savePath) => {
            if (!this.streams.has(clientId) || !this.streams.get(clientId).read.has(savePath)) return;
            if (globalProps.platform == 'Android') this.streams.get(clientId).read.get(savePath).read();
            else if (globalProps.platform == 'Computer') this.streams.get(clientId).read.get(savePath).resume();
        });

        // The client emits this event either the download has been cancelled or failed
        socket.on('cancel download', (clientId, savePath, shouldEmitBack) => {
            const streamData = this.streams.get(clientId).read.get(savePath);
            this.streams.get(clientId).read.delete(savePath);
            streamData.destroy();
            const fileName = path.basename(savePath);
            if (shouldEmitBack) {
                socket.emit('download cancelled', clientId, savePath);
                socket.emit('send message to client', clientId, 'cancel', fileName);
            }
        });

        // This event emits when a client uploads a file to the host
        socket.on('start host write stream session', async (clientId, fileName, fileSize, uploadPath, hostUploadPath, bufferSize) => {
            try {
                // Double checks if the client is exists within the streams map. if not, adds him
                if (!this.streams.has(clientId)) await this.addClientToStreamsMap(clientId);

                // If there is a file in hostUploadPath (The path of the host where the file will be uploaded), deletes it
                if (globalProps.platform == 'Android') {
                    if (await fs.exists(hostUploadPath)) {
                        await fs.unlink(hostUploadPath);
                    }
                } else if (globalProps.platform == 'Computer') {
                    if (fs.existsSync(hostUploadPath)) {
                        fs.unlinkSync(hostUploadPath);
                    }
                }
                
                // If there is already hostUploadPath inside the write streams map of the client, cancels and deletes it from the map
                if (this.streams.get(clientId).write.has(hostUploadPath)) {
                    this.streams.get(clientId).write.get(hostUploadPath).write.stream.destroy();
                    this.streams.get(clientId).write.get.delete(hostUploadPath);
                }

                // The writeStream object itself
                var writeStream;
                // The approximate number of iterations needed to do to fully read the file
                var total;

                // Uses the function intended to each platform to initialize the write stream
                if (globalProps.platform == 'Android') {
                    writeStream = AndroidFs.createWriteStream(hostUploadPath);
                    total = fileSize > bufferSize ? Math.trunc(fileSize / bufferSize) + 2 : 1;
                } else if (globalProps.platform == 'Computer') {
                    writeStream = fs.createWriteStream(hostUploadPath, {
                        encoding: 'base64'
                    });
                    total = Math.trunc(fileSize / bufferSize) + 2;
                }

                // Adds the write stream to the write streams map of the client
                this.streams.get(clientId).write.set(hostUploadPath, { stream: writeStream, progress: { current: 0, total: total, last: 0 } });

                // Informs the client that the host is ready to get the file
                socket.emit('host write stream session started', clientId, fileName, fileSize, uploadPath, hostUploadPath, bufferSize);
            } catch (error) {
                console.log(error);
            }
        });

        // This event is emitted by the client after every file chunk read successfully
        socket.on('client file chunk', async (clientId, chunk, uploadPath, hostUploadPath) => {
            try {
                // Gets the write stream from the client write streams map
                const streamData = this.streams.get(clientId).write.get(hostUploadPath);
                // If the write stream was not found, returns
                if (!streamData) return;

                // Uses the function intended to each platform to write the file chunk into the write stream
                if (globalProps.platform == 'Android') {
                    await streamData.stream.write(chunk);
                } else if (globalProps.platform == 'Computer') {
                    const decoded = Buffer.from(chunk, 'base64');
                    streamData.stream.write(decoded);
                }

                streamData.progress.current += 1;

                const current = streamData.progress.current / streamData.progress.total;
                const rounded = Math.trunc(current * 100);
                if (streamData.progress.last < rounded) {
                    streamData.progress.last = rounded;
                }

                // if not using progress, delete it

                // Informs the client that the file chunk was successfully wrote into the write stream and is ready to get the next one
                socket.emit('tell the client that the host is ready to get the next file chunk', clientId, uploadPath);
            } catch (error) {
                console.log(error);
            }
        });

        // When all the file chunks were fully sent, the client emits this event in order to make the host close the write stream and show the file uploaded toast
        socket.on('client file uploaded', async (clientId, hostUploadPath, username) => {
            try {
                await this.destroyWriteStream(clientId, hostUploadPath, false, false);
                Toast.show({ description: `${username} just finished uploading a file!` });
            } catch (error) {
                console.log(error);
            }
        });

        // This event emits whenever the client cancels a file upload
        socket.on('cancel upload', async (clientId, uploadPath, hostUploadPath, shouldEmitBack) => {
            try {
                await this.destroyWriteStream(clientId, hostUploadPath, true, false);
                const baseName = path.basename(uploadPath);
                const fileName = baseName.replace(`${clientId}-`, '');
                if (shouldEmitBack) {
                    socket.emit('upload cancelled', clientId, uploadPath);
                    socket.emit('send message to client', clientId, 'cancel', fileName);
                }
            } catch (error) {
                console.log(error);
            }
        });

        // When the client select an audio or image to preview, he emits this event, which tells the host to sent the file as one piece as base64 encoding
        socket.on('get file to preview from host', async (clientId, path) => {
            try {
                if (globalProps.platform == 'Android' && path[0] != '/') path = '/' + path;
                var file;
                const mimeType = mime.lookup(path).toString();
                const fileType = mimeType.split('/')[0];
                if (globalProps.platform == 'Android') {
                    file = await fs.readFile(path, 'base64');
                } else if (globalProps.platform == 'Computer') {
                    file = fs.readFileSync(path, { encoding: 'base64' });
                }
                socket.emit('host file preview', clientId, file, path, mimeType, fileType);
            } catch (error) {
                console.log(error);
                console.log('File not found!');
            }
        });

        // This events emits whenever a client joins a room, telling the appropriate host to add it to the room streams map
        socket.on('add client to streams map', async (clientId) => {
            // Tries to add the client to the streams map
            try {
                await this.addClientToStreamsMap(clientId);
            } catch (error) {
                console.log(error);
            }
        });

        // This events emits whenever a client leaves a room, telling the appropriate host to remove it from the room streams map
        socket.on('remove client from streams map', async (clientId) => {
            try {
                await this.removeClientFromStreamsMap(clientId);
            } catch (error) {
                console.log(error);
            }
        });

        // There is an event in the Computer App.tsx file which sends the window dimensions on resize and updates them accordingly
        if (globalProps.platform == 'Computer') {
            socket.on('update dimensions', (dimensions) => {
                this.setState({ width: dimensions.width, height: dimensions.height });
            });
        }

        // For Android, treat back button as go one folder back
        if (globalProps.platform == 'Android') BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    }

    // On room delete/app close/disconnection from server delete the state, cancel all the file downloads and uploads and unlisten all the room host events
    async componentWillUnmount() {
        // Deletes the state
        this.setState({});
        try {
            // Iterats all the clients inside the streams map
            this.streams.forEach(async (value, clientId) => {
                // Iterats all the read streams for each client inside the streams map
                this.streams.get(clientId).read.forEach(async (value, savePath) => {
                    // Optionally: instead of telling the client for each file, push the savePaths to an array and then emit once, and make the client to cancel all the downloads
                    // Cancels each client read stream one by one
                    await this.destroyReadStream(clientId, savePath, true);
                });

                // Iterats all the write streams for each client inside the streams map
                this.streams.get(clientId).write.forEach(async (value, uploadPath) => {
                    // Optionally: instead of telling the client for each file, push the savePaths to an array and then emit once, and make the client to cancel all the uploads
                    // Cancels each client write stream one by one
                    await this.destroyWriteStream(clientId, uploadPath, true, true);
                });
                // Used to tell the client the reason of host disconnection. If the globalProps.room is not undefined, it means that the host is reconnected, else disconnected
                if (globalProps.room != undefined) socket.emit('send message to client', clientId, 'reconnect');
                else socket.emit('send message to client', clientId, 'disconnect');
            });

            // Clears the streams map
            this.streams.clear();
        } catch (error) {
            console.log(error);
        }
        //clearInterval(this.updateFilesLoop);

        // Unlistens all the events
        socket.off('get storages');
        socket.off('get files');
        socket.off('start sending file to client');
        socket.off('client is ready to get the next file chunk');
        socket.off('cancel download');
        socket.off('start host write stream session');
        socket.off('client file chunk');
        socket.off('client file uploaded');
        socket.off('cancel upload');
        socket.off('get file to preview from host');
        socket.off('add client to streams map');
        socket.off('remove client from streams map');
        if (globalProps.platform == 'Computer') {
            socket.off('update dimensions');
        }

        // Resets Android back button functionality to default
        if (globalProps.platform == 'Android') BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    }

    // What to do on Android back button press
    onBackPress() {
        // Go to previous folder on Android back button press
        this.onFilePress('..', this.state.previousPath);
        // The BackHandler.addEventListener and BackHandler.removeEventListener require a boolean function to work
        return true;
    }

    // This function executes on any file item press
    async onFilePress(nameA: string, pathA: string) {
        // If the file has no path, return
        if (!pathA) return;
        // If the first character of the path is '/', slice it
        if (pathA[0] == '/') pathA = pathA.substring(1);
        // If there is any indication that the path is the first main directory of the drive/sdcard, show storage list
        if ((pathA == 'storage' || pathA == 'storage/emulated') || (nameA == '..' && this.state.previousPath && this.state.path && (this.state.previousPath == this.state.path || this.state.previousPath + '/' == this.state.path)))
            return this.getStorages();
        // If the platform is Computer, replace all backward slashes with normal slashes
        if (globalProps.platform == 'Computer') pathA = path.resolve(pathA).replace(/\\/g, '/');
        // Uses the appropriate platform module function to check if the path is directory
        const isDirectory = globalProps.platform == 'Android' ? (await fs.stat(pathA)).isDirectory() : fs.lstatSync(pathA).isDirectory();
        // What to do if the path is directory
        if (isDirectory) {
            // An empty previousPath variable
            var previousPath;
            // Splits the path to an array of normal slashes
            const previousPathArray: Array<String> = pathA.split('/');
            // What to do if the platform is Android
            if (globalProps.platform == 'Android') {
                // Removes the last element of the previousPathArray
                previousPathArray.pop();
                // Merges all the previousPathArray elements as one string and places normal slash in between
                previousPath = previousPathArray.join('/');
                // What to do if the platform is Computer
            } else if (globalProps.platform == 'Computer') {
                // Removes the last element of the previousPathArray if the length of the array is bigger than 0
                if (previousPathArray.length > 0) previousPathArray.pop();
                // Resolves the path of a merge of all the previousPathArray elements as one string with normal slash in between, and replaces all backward slashes with normal slashes
                previousPath = path.resolve(previousPathArray.join('/')).replace(/\\/g, '/');
            }
            // Executes the readDirectory function with previousPath as the first element (path before read), and pathA as the second element (path to read from)
            this.readDirectory(previousPath, pathA);
            // What to do if the path is not directory
        } else {
            // Gets the file mime type by the path argument, converts it to string and splits it by normal slash
            const mimeType = mime.lookup(pathA).toString().split('/');
            // Gets the first argument of mimeType (for example, if the file is an mp3 file, the first argument will be "audio")
            const fileType = mimeType[0];
            // If the filePreviewTypes not includes fileType, return
            if (!filePreviewTypes.includes(fileType)) return;
            // Updates the fileType state section to the type of the file, showPreview state section to true and filePath to the path of the file
            this.setState({ fileType: fileType, showPreview: true, filePath: pathA });
        }
    }

    // Get storage list function
    async getStorages() {
        // Uses a function from FS.tsx file that I wrote. It uses the appropriate modules depending on the platform to get the storage list
        const storages = await fsFunctions.getStorages();
        // Updates files state section to the storage list. path and previousPath state sections are updated to null
        this.setState({ files: storages, path: null, previousPath: null });
    }

    // Whether to show the preview modal or not
    getPreviewState() {
        // Returns showPreview state section value (true or false)
        return this.state.showPreview;
    }

    updatePreviewState() {
        // Updates showPreview state section to false. fileType and filePath state sections are updated to null
        if (this.state.showPreview) this.setState({ fileType: null, showPreview: false, filePath: null });
    }

    // Read directory function
    async readDirectory(previousPath, dirPath) {
        // Gets the file list of dirPath
        const files = await fsFunctions.readDirectory(previousPath, dirPath, this.cachedImages);
        // Updates files state section to the file list, path state section to the current directory path and previousPath to the previous directory path
        this.setState({ files: files, path: dirPath, previousPath: previousPath });

        // What to do if the platform is Android
        if (globalProps.platform == 'Android') this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
        // What to do if the platform is Computer
        else if (globalProps.platform == 'Computer') {
            try {
                // Scroll to the top of the file list
                this.flatListViewRef._listRef._scrollRef.scrollTo({ x: 0, y: 0, animated: false });
            } catch (error) {
                // If failed, scroll to the top of the file list using another method
                this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
            }
        }
    }

    // A function used as the renderList argument of the BigList element inside the render function
    renderFileList({ item, index }) {
        return <FileItem file={item} index={index} state={this.state} setState={this.setState} onFilePress={this.onFilePress} />
    }

    /*scrollToFirstJfif() {
        const firstJfif = this.state.files.find(file => file.name.endsWith('.jfif'));
        const index = this.state.files.indexOf(firstJfif);
        const animated = true;
        this.flatListViewRef.scrollToIndex({ index, animated });
    }*/

    // A function to destroy read stream
    destroyReadStream(clientId, savePath, shouldEmitToClient) {
        // Returns a void promise
        return new Promise<void>(async (resolve, reject) => {
            try {
                // Gets the client streams map by his id
                const clientStreams = this.streams.get(clientId);
                // If there are no clients with id of clientId within the streams map, resolve the promise (aka return)
                if (!clientStreams) resolve();
                // Gets the read stream by its path from the read streams map of the clientStreams variable
                const streamData = clientStreams.read.get(savePath);
                // If there are no read streams with path of savePath within the client read streams map, resolve the promise (aka return)
                if (!streamData) resolve();
                // If the read stream is not destroyed (closed) or undefined, tries to close it and does nothing if failed
                if (!streamData.destroyed || streamData.destroyed == undefined) {
                    try {
                        // Destroys the read stream
                        streamData.stream.destroy();
                    } catch (error) { }
                }
                // Deletes the read stream from the client read streams map
                clientStreams.read.delete(savePath);
                /*
                    shouldEmitToClient will be true if this function executed from the componentWillUnmount function, false if this function executed from a socket event.
                    If shouldEmitToClient is true, it means that the file download was cancelled and the client's write stream needs to be cancelled.
                    If shouldEmitToClient is false, there is no need to update the client to cancel the write stream on his side.
                */
                if (shouldEmitToClient) socket.emit('download cancelled', clientId, savePath);
                // Resolves the promise
                resolve();
            } catch (error) {
                // If there was an error, reject the promise with the appropriate error
                reject(error);
            }
        });
    }

    destroyWriteStream(clientId, uploadPath, shouldDeleteFile, shouldEmitToClient) {
        // Returns a void promise
        return new Promise<void>(async (resolve, reject) => {
            try {
                // Gets the client streams map by his id
                const clientStreams = this.streams.get(clientId);
                // If there are no clients with id of clientId within the streams map, resolve the promise (aka return)
                if (!clientStreams) resolve();
                // Gets the write stream by its path from the write streams map of the clientStreams variable
                const streamData = clientStreams.write.get(uploadPath);
                // If there are no write streams with path of savePath within the client write streams map, resolve the promise (aka return)
                if (!streamData) resolve();
                // If the write stream is not destroyed (closed) or undefined, tries to close it and does nothing if failed
                if (!streamData.destroyed || streamData.destroyed == undefined) {
                    try {
                        // Destroys the write stream
                        streamData.stream.destroy();
                    } catch (error) { }
                }
                // Deletes the write stream from the client write streams map
                clientStreams.write.delete(uploadPath);
                /*
                    shouldDeleteFile will be true if the file upload was cancelled or failed, which means that a file deletion from uploadPath is required.
                    shouldDeleteFile will be false if the file upload was successful, which means that no file deletion is required.
                */
                if (shouldDeleteFile) {
                    // Sometimes the exists check running before the file being created, and not deleting the file. A delay of 1ms fixed this
                    setTimeout(async () => {
                        try {
                            // What to do if the platform is Android
                            if (globalProps.platform == 'Android') {
                                // Checks if a file in uploadPath is exists
                                if (await fs.exists(uploadPath)) {
                                    // Deletes the file that is located at uploadPath
                                    await fs.unlink(uploadPath);
                                }
                                // What to do if the platform is Computer
                            } else if (globalProps.platform == 'Computer') {
                                // Checks if a file in uploadPath is exists
                                if (fs.existsSync(uploadPath)) {
                                    // Deletes the file that is located at uploadPath
                                    fs.unlinkSync(uploadPath);
                                }
                            }
                        } catch (error) { }
                    }, 1);
                }
                /*
                    shouldEmitToClient will be true if this function executed from the componentWillUnmount function, false if this function executed from a socket event.
                    If shouldEmitToClient is true, it means that the file upload was cancelled and the client's read stream needs to be cancelled.
                    If shouldEmitToClient is false, there is no need to update the client to cancel the read stream on his side.
                */
                if (shouldEmitToClient) socket.emit('upload cancelled', clientId, uploadPath);
                // Resolves the promise
                resolve();
            } catch (error) {
                // If there was an error, rejects the promise with the appropriate error
                reject(error);
            }
        });
    }

    // A function that adds a client to the streams map
    addClientToStreamsMap(clientId) {
        // Returns a boolean promise
        return new Promise<boolean>((resolve, reject) => {
            try {
                // Adds the client to the streams map by his id
                this.streams.set(clientId, {
                    read: new Map<any, any>(),
                    write: new Map<any, any>()
                });
                // Resolves the promise
                resolve(true);
            } catch (error) {
                // If there was an error, rejects the promise with the appropriate error
                reject(error);
            }
        });
    }

    // A function that removes a client from the streams map
    removeClientFromStreamsMap(clientId) {
        // Returns a boolean promise
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                // Creates a promises array of any type
                const promises: Array<Promise<any>> = [];
                // Gets the client streams map by his id
                const clientStreams = this.streams.get(clientId);
                // Iterates each read stream
                clientStreams.read.forEach(async (value, savePath) => {
                    // Pushes each this.destroyReadStream function with the path of each read stream as the second argument of the function to the promises array
                    promises.push(this.destroyReadStream(clientId, savePath, false));
                });
                
                // Iterates each write stream
                clientStreams.write.forEach(async (value, uploadPath) => {
                    // Pushes each this.destroyWriteStream function with the path of each write stream as the second argument of the function to the promises array
                    promises.push(this.destroyWriteStream(clientId, uploadPath, true, false));
                });

                // Executes all the functions one by one and waits until all of them will be executed
                await Promise.all(promises);
                // Removes the client from the streams map by his id
                this.streams.delete(clientId);
                // Resolves the promise
                resolve(true);
            } catch (error) {
                // If there was an error, rejects the promise with the appropriate error
                reject(error);
            }
        });
    }

    render() {
        // TODO: when the host deletes room, send each client who is currently downloading/uploading to stop before deleting the room completely
        //       on stop, the files who are not fully done should be deleted
        // TODO: optionally, add ui for the host so he can see the progress for each file that each client is downloading/uploading
        // TODO: optionally, add context menu for host

        /*
            <View>
                <Button width={'25%'} height={'25%'} alignSelf={'center'} rounded={'full'} onPress={this.scrollToFirstJfif}>Scroll to first .jfif</Button>
            </View>
        */
        return (
            <>
                { /* If the showPreview state section value is true, render the file preview modal */ }
                {this.state.showPreview && <FilePreview path={this.state.filePath} fileType={this.state.fileType} maxToRenderPerBatch={1} fileMimeType={this.state.fileMimeType} filePreview={this.state.filePreview} showPreview={this.state.showPreview} updatePreviewState={this.updatePreviewState} />}
                { /* Renders the file list */ }
                <View flex={1}>
                    { /* BigList is a custom list that someone made that comes to replace FlatList (it handles better with enormous amount of items) */ }
                    <BigList itemHeight={39} ref={(e) => this.flatListViewRef = e} data={this.state.files} renderItem={this.renderFileList} keyExtractor={(item, index) => item.name} indicatorStyle='white' style={
                        {
                            margin: 25,
                            borderTopLeftRadius: 25,
                            borderBottomLeftRadius: 25,
                            backgroundColor: 'rgb(24, 24, 27)',
                            height: globalProps.platform == 'Computer' ? this.state.height - 230 : undefined,
                        }
                    }
                        contentContainerStyle={
                            {
                                padding: 15,
                                paddingBottom: 5,
                                paddingTop: 5,
                                flexGrow: globalProps == 'Android' ? 1 : undefined
                            }
                        }
                    />
                </View>
            </>
        )
    }
}

export default HostFiles;