import React, { Component } from 'react';
import { Center, Text, View, Toast, Modal, VStack, Button, StatusBar } from 'native-base';
import globalProps from 'shared/GlobalProps';
import { Socket } from 'socket.io-client';
import { Dimensions, BackHandler } from 'react-native';
import path from 'path';
import mime from 'mime-types';
import FilePreview from './ClientFilePreview';
import * as Progress from 'react-native-progress';
import ContextMenu from './Menus/ContextMenu';
import * as AndroidFs from 'shared/functions/Android/AndroidFs';
import BigList from "react-native-big-list";
import FileItem from 'shared/components/FileItem';

/*
    TODO checks:
        1. check if the client is actually gets added to the host streams map when joining to a room
        2. check if the client is actually gets removed from the host streams map when leaving a room
        3. check if the client readStreams and writeStreams get cleaned
        4. check if the host streams map gets cleaned from the client who left a room
*/

var fs;
var rnfs;
var DocumentPicker;
var ipcRenderer;

var sharp;

try {
    fs = window.require('fs');
    sharp = window.require('sharp');
    ipcRenderer = window.require("electron").ipcRenderer;
} catch (error) {
    fs = require('react-native-fs');
    rnfs = require('react-native-fetch-blob').default;
    DocumentPicker = require('react-native-document-picker');
}

var socket: Socket;

var mbps = 0;
var start;
var end;
var totalStart;
var totalEnd;
var time;

const filePreviewTypes = ['audio', 'image'];

// TODO: Optionally, add an ability to ctrl + f on the computer and a button with search icon on both to search file

class ClientFiles extends Component<any, any> {
    updateFilesLoop: any;
    readStreams: Map<any, any>;
    writeStreams: Map<any, any>;
    flatListViewRef: any;
    saveDirectory: any;
    cachedImages: Map<any, any> = new Map();
    cachedDirectories: Map<any, any> = new Map();
    cachedFiles: Map<any, any> = new Map(); // update cache depending on the file changes (for example, if file is deleted remove it from the cache)
    filesToUpload: Array<any> = [];
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
            //renderLongPress: false,
            longX: 0,
            longY: 0,
            filePath: null,
            progress: 0,
            renderProgress: false,
            file: null,
            filePreview: null,
            fileMimeType: null,
            mbps: 0,
            operation: null,
            time: null,
            selectedFiles: []
        }

        this.readStreams = new Map();
        this.writeStreams = new Map();

        // Binds some function so I can use them as "{this.functionName}" instead of "{() => this.functionName(...)}"
        this.getPreviewState = this.getPreviewState.bind(this);
        this.updatePreviewState = this.updatePreviewState.bind(this);
        this.downloadFileFromHost = this.downloadFileFromHost.bind(this);
        this.uploadFileToHost = this.uploadFileToHost.bind(this);
        this.setState = this.setState.bind(this);
        this.cancelDownload = this.cancelDownload.bind(this);
        this.cancelUpload = this.cancelUpload.bind(this);
        this.renderList = this.renderList.bind(this);
        this.onFilePress = this.onFilePress.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
    }

    // What to do when this component is loaded
    async componentDidMount() {
        // After the host got his storage list, he emits this event to tell the client to update his file list window to show the appropriate host storages
        socket.on('host storages', async (storages) => {
            // Updates the file list to show the available host storages within the path of dirPath using the setState function to update the state and rerender this component
            this.setState({ files: storages, path: null, previousPath: null });
            // Scrolls to the top of the list using the appropriate functions for each platform
            if (globalProps.platform == 'Computer') {
                try {
                    this.flatListViewRef._listRef._scrollRef.scrollTo({ x: 0, y: 0, animated: false });
                } catch (error) {
                    this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
                }
            } else if (globalProps.platform == 'Android') this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
        });

        // After the host got his file list from the requested path, he emits this event to tell the client to update his file list window to show the appropriate host files
        socket.on('host files', async (files, previousPath, dirPath: string) => {
            // Updates the file list to show the host files within the path of dirPath using the setState function to update the state and rerender this component
            this.setState({ files: files, path: dirPath, previousPath: previousPath });
            // Scrolls to the top of the list using the appropriate functions for each platform
            if (globalProps.platform == 'Computer') {
                try {
                    this.flatListViewRef._listRef._scrollRef.scrollTo({ x: 0, y: 0, animated: false });
                } catch (error) {
                    this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
                }
            } else if (globalProps.platform == 'Android') this.flatListViewRef.scrollTo({ x: 0, y: 0, animated: false });
        });

        // This event emits by the server itself when the client requests to download a file from the host (I did it this way because the bufferSize is initialized server-sided) 
        socket.on('start write stream session', async (fileName, filePath, savePath, bufferSize) => {
            try {
                // Gets the first selected file from selectedFiles array (according to the order of selection)
                const file = this.state.selectedFiles[0];
                // If there is no file at the first index, returns
                if (!file) return;

                // Updates the state to show the progress modal
                this.setState({ renderProgress: true, progress: 0, operation: 'downloading' });
                // Waits 0.2ms to let the progress modal fully load
                await sleep(200);

                //if (this.writeStreams.has(savePath)) throw new Error('You already downloading this file!'); // if in the future it will be needed, overwrite the writeStream

                // If there is already savePath inside the write streams map, cancels and deletes it from the map
                if (this.writeStreams.has(savePath)) {
                    this.writeStreams.get(savePath).stream.destroy();
                    this.writeStreams.delete(savePath);
                }

                // The write stram object
                var writeStream;
                // The approximate number of iterations needed to do to fully read the file calculated by its size
                var total;

                // Uses the function intended for each platform to initialize the write stream
                if (globalProps.platform == 'Android') {
                    writeStream = AndroidFs.createWriteStream(savePath);
                    total = Math.trunc(file.size / bufferSize) + 2;
                    total = file.size > bufferSize ? total : 1;
                } else if (globalProps.platform == 'Computer') {
                    writeStream = fs.createWriteStream(savePath, {
                        encoding: 'base64'
                    });
                    total = Math.trunc(file.size / bufferSize) + 2;
                }

                // Resets mbps on write stream cancel
                writeStream.on('cancel', () => mbps = 0);

                // Adds the write stream to the write streams map
                this.writeStreams.set(savePath, { stream: writeStream, progress: { current: 0, total: total, last: 0 } });

                // An object used to calculate the start time of each file chunk write iteration
                start = new Date();
                // An object used to calculate the total start time of all the file chunk write iterations as one
                totalStart = new Date();

                // Informs the host that the client is ready to get the file
                socket.emit('write stream session started', fileName, filePath, savePath, bufferSize);
            } catch (error) { }
        });

        socket.on('host file chunk', async (chunk, savePath) => {
            try {
                // An object used to calculate the end time of each file chunk write iteration
                end = new Date();
                // Gets the savePath write stream from the write streams map
                const streamData = this.writeStreams.get(savePath);
                // If the write stream was not found, returns
                if (!streamData) return;

                // Uses the function intended to each platform to write the file chunk into the write stream
                if (globalProps.platform == 'Android') {
                    await streamData.stream.write(chunk);
                } else if (globalProps.platform == 'Computer') {
                    const decoded = Buffer.from(chunk, 'base64');
                    streamData.stream.write(decoded);
                }

                // Adds one to the current amount file chunks writed
                streamData.progress.current += 1;

                // If the progress state section value is not 1, calculates the next mbps value of the base64 encoded file chunk using it's padding
                if (this.state.progress != 1) {
                    // Gets the file chunk size as bytes
                    const chunkSize = getChunkSize(chunk);
                    // Adds the value of the chunkSize object to the global mbps object
                    mbps += chunkSize;
                    // For performance purposes, only updates the mbps state section value if its value is different from the global mbps object value
                    if (this.state.mbps != mbps) this.setState({ mbps });
                    // Waits 1s, then subtracts the chunkSize value from the global mbps object (doesn't block the code from continue)
                    setTimeout(() => {
                        // If the progress state section value is 1, returns
                        if (this.state.progress == 1) return;
                        // The subtruction itself
                        mbps -= chunkSize;
                    }, 1000);

                    // Calculates the amount of seconds it took for the file chunk to be sent from the host to the client
                    const time = ((end.getTime() - start.getTime()) / 1000);
                    // Updates the time state section value to the approximate time that the file will be fully downloaded
                    this.setState({ time: ((time * (streamData.progress.total - streamData.progress.current))).toFixed(2) });
                }

                // Calculates the approximate progress value
                const current = streamData.progress.current / streamData.progress.total;
                // Multiplies the current by 100 and then slices all the numbers after the dot
                const rounded = Math.trunc(current * 100);
                // If the write stream last progress value is smaller than the new progress value, updates the progress
                if (streamData.progress.last < rounded) {
                    // the write stream last progress value is now updated to the new progress value
                    streamData.progress.last = rounded;
                    // Updates the progress state section value to the current progress value calculated earlier
                    this.setState({ progress: current });
                }
                // If the platform is Computer, updates the progress bar of the app icon in the taskbar of Windows
                if (globalProps.platform == 'Computer') ipcRenderer.send('set taskbar progress', current);
                // Redeclares the start time for the next loop
                start = new Date();
                // Only informs the host that the client is ready to get the next file chunk if the renderProgress state section value is true
                if (this.state.renderProgress) socket.emit('tell the host that the client is ready to get the next file chunk', savePath);
            } catch (error) {
                console.log(error);
            }
        });

        // This event emits when all the file chunks were successfully download
        socket.on('host file downloaded', async (savePath) => {
            try {
                // An object used to calculate the total start time of all the file chunk write iterations as one
                totalEnd = new Date();
                // If the progress state section is not 1, sets it to 1
                if (this.state.progress != 1) this.setState({ progress: 1 });
                // If the platform is Computer, resets the progress bar of the app icon in the taskbar of Windows by sending a negative number
                if (globalProps.platform == 'Computer') ipcRenderer.send('set taskbar progress', -1);
                // If the time state section is not 0, sets it to 0
                if (this.state.time != 0) this.setState({ time: 0 });
                // Gets the downloaded file name by its path
                const fileName = path.basename(savePath);
                // Waits 0.5ms to let the progress bar update smoothly
                await sleep(500);
                // Destroys the write stream
                await this.destroyWriteStream(savePath, false, false);
                // Resets mbps and time values to default
                mbps = 0;
                time = null;
                // Gets the first selected file from selectedFiles array (according to the order of selection)
                const file = this.state.selectedFiles[0];
                // Unnecessary because the I know that the index will be 0 every time but just to make sure, finds the index of the selected file within the selectedFiles array
                const fileIndex = this.state.selectedFiles.indexOf(file);
                // Removes the file from the selectedFiles array by it's fileIndex
                this.state.selectedFiles.splice(fileIndex, 1);
                // Informs the client that the file was successfully downloaded and tells him how much time it took
                Toast.show({ description: `${fileName} downloaded!\nTook ${((totalEnd.getTime() - totalStart.getTime()) / 1000).toFixed(2)} seconds` });
                // If there are files in the selectedFiles, downloads the next one
                if (this.state.selectedFiles.length > 0) {
                    // Resets the state sections values of progress, mbps and time to default
                    this.setState({ progress: 0, mbps: 0, time: null });
                    // Waits 0.2ms to let the progress modal fully reset
                    await sleep(200);
                    // Downloads the next file in the list
                    this.downloadFileFromHost();
                // If there are no more files to download
                } else {
                    // Resets the saveDirectory value
                    this.saveDirectory = null;
                    // Resets the state sections values of renderProgress, mbps and time to default
                    this.setState({ renderProgress: false, mbps: 0, time: null });
                }
            } catch (error) {
                console.log(error);
            }
        });

        // This event emits when a download of a file is either failed or cancelled
        socket.on('download cancelled', async (savePath) => {
            try {
                // Destroys the write stream
                await this.destroyWriteStream(savePath, true, false);
                // Resets mbps and time values to 0
                mbps = 0;
                time = null;
                // Gets the first selected file from selectedFiles array (according to the order of selection)
                const file = this.state.selectedFiles[0];
                // Unnecessary because the I know that the index will be 0 every time but just to make sure, finds the index of the selected file within the selectedFiles array
                const fileIndex = this.state.selectedFiles.indexOf(file);
                // Removes the file from the selectedFiles array by it's fileIndex
                this.state.selectedFiles.splice(fileIndex, 1);
                // If there are files in the selectedFiles, downloads the next one
                if (this.state.selectedFiles.length > 0) {
                    // Resets the state sections values of progress, mbps and time
                    this.setState({ progress: 0, mbps: 0, time: null });
                    // Waits 0.2ms to let the progress modal fully reset
                    await sleep(200);
                    // Calls the downloadFileFromHost function
                    this.downloadFileFromHost();
                }
                else {
                    // Resets the saveDirectory value
                    this.saveDirectory = null;
                    // Resets the state sections values of renderProgress, mbps and time
                    this.setState({ renderProgress: false, mbps: 0, time: null });
                }
            } catch (error) {
                console.log(error);
            }
        });

        // This event is emitted by the host when he prepared everything and ready to get the file from the client
        socket.on('start uploading file to host', async (fileName, fileSize, uploadPath, hostUploadPath, bufferSize) => {
            // The readStream object (outside of the try catch statement on purpose)
            var readStream;
            try {
                // The current file upload progress value (can be any value between 0-1)
                var current = 0;
                // The number of file chunks that were successfully uploaded
                var chunksUploaded = 0;
                // The approximate number of iterations needed to do to fully read the file calculated by the its size
                var total;

                // Updates the state to show the progress modal
                this.setState({ renderProgress: true, progress: 0, operation: 'uploading' });
                // Waits 0.2ms to let the progress modal fully load
                await sleep(200);

                // Uses the function intended for each platform to initialize the read stream
                if (globalProps.platform == 'Android') {
                    total = fileSize > bufferSize ? Math.trunc(fileSize / bufferSize) + 2 : 1;
                    readStream = AndroidFs.createReadStream(uploadPath, {
                        highWaterMark: bufferSize
                    });
                } else if (globalProps.platform == 'Computer') {
                    total = Math.trunc(fileSize / bufferSize) + 2;
                    readStream = fs.createReadStream(uploadPath, {
                        encoding: 'base64',
                        highWaterMark: bufferSize
                    });

                    // For the Computer platform, listens to any error that may occur when reading the file. If an error occurs, the read stream gets destroyed
                    readStream.on('error', async (e) => {
                        // Destroys the read stream, tells the host to destroy his write stream and updates him that there was an error while uploading the file
                        await this.destroyReadStream(uploadPath, true);
                        // Throws an error which says "There was an error while sending ${fileName} to the client!" (fileName is the name of the file)
                        throw new Error(`There was an error while sending ${fileName} to the host!`);
                    });
                }

                // The start date of reading the file
                totalStart = new Date();

                // To get the data chunks as do whatever I want with them, I have to listen to the data event
                readStream.on('data', async (chunk) => {
                    // The start date of each read iteration
                    start = new Date();
                    // Sends the file chunk to the host
                    socket.emit('client file chunk', chunk, uploadPath, hostUploadPath);
                    // The pause of the read stream is only available on the fs of the Computer because it's implemented differently than the Android's one
                    if (globalProps.platform == 'Computer') {
                        /*
                            I had a problem on the Computer platform that if the file is either not readable or its size is smaller or equals to the buffer size
                            and I pause the read stream, the end event will not get emitted.
                            Doing the check below makes sure that the read stream gets paused only none of the conditions are true
                        */
                       console.log(chunk);
                        //if (!readStream.readable || fileSize <= bufferSize) return;
                        readStream.pause();
                    }

                    if (this.state.progress != 1) {
                        // Gets the file chunk size as bytes
                        const chunkSize = getChunkSize(chunk);
                        // Adds the value of the chunkSize object to the global mbps object
                        mbps += chunkSize;
                        // For performance purposes, only updates the mbps state section value if its value is different from the global mbps object value
                        if (this.state.mbps != mbps) this.setState({ mbps });
                        // Waits 1s, then subtracts the chunkSize value from the global mbps object (doesn't block the code from continue)
                        setTimeout(() => {
                            // If the progress state section value is 1, returns
                            if (this.state.progress == 1) return;
                            // Subtructs the value of the chunkSize object from the global mbps object
                            mbps -= chunkSize;
                        }, 1000);

                        // If the time object value is not null, update the approximate remaining time until the file upload ends
                        if (time) this.setState({ time: (time * (total - chunksUploaded)).toFixed(2) });
                    }

                    // Adds 1 to the amount of file chunks uploaded
                    chunksUploaded++;
                    // Calculates the approximate progress value
                    current = chunksUploaded / total;
                    // Multiplies the current by 100 and then slices all the numbers after the dot
                    const rounded = Math.trunc(current * 100);
                    // If the state progress value * 100 is smaller than the new progress value, updates the progress
                    if (Math.trunc(this.state.progress * 100) < rounded) {
                        this.setState({ progress: current });
                    }
                    // If the platform is Computer, updates the progress bar of the app icon in the taskbar of Windows
                    if (globalProps.platform == 'Computer') ipcRenderer.send('set taskbar progress', current);
                });

                // Once the read stream finished, this event emits
                readStream.on('end', async () => {
                    // The end date of reading the file
                    totalEnd = new Date();
                    // Informs the host that the file upload is finished. Used to make him close his write stream and to notify him that a client just finished to upload a file
                    socket.emit('client file uploaded', hostUploadPath);
                    // The progress calculation is not precise, so if the progress is not equals to 1, set it to 1
                    if (this.state.progress != 1) this.setState({ progress: 1 });
                    // If the platform is Computer, resets the progress bar of the app icon in the taskbar of Windows by sending a negative number
                    if (globalProps.platform == 'Computer') ipcRenderer.send('set taskbar progress', -1);
                    // If the remaining time value is not equals to 0, set it to 0
                    if (this.state.time != 0) this.setState({ time: 0 });
                    // Destroys the read stream
                    this.destroyReadStream(uploadPath, false);
                    // Gets the downloaded file name by its upload path
                    const fileName = path.basename(uploadPath);
                    // Waits 0.5ms to let the progress bar update smoothly
                    await sleep(500);
                    // Resets mbps and time values to default
                    mbps = 0;
                    time = null;
                    // Removes the first uploaded file from filesToUpload array (according to the order of selection)
                    this.filesToUpload.splice(0, 1);
                    // Informs the client that the file was successfully downloaded and tells him how much time it took
                    Toast.show({ description: `${fileName} uploaded!\nTook ${((totalEnd.getTime() - totalStart.getTime()) / 1000).toFixed(2)} seconds` });
                    // If there are files in the filesToUpload, upload the next one
                    if (this.filesToUpload.length > 0) {
                        // Resets the state sections values of progress, mbps and time to default
                        this.setState({ progress: 0, mbps: 0, time: null });
                        // Waits 0.2ms to let the progress modal fully reset
                        await sleep(200);
                        // Uploads the next file in the list
                        this.uploadFileToHost();
                    }
                    // If there are no more files to upload, resets the state sections values of renderProgress, mbps and time to default
                    else this.setState({ renderProgress: false, mbps: 0, time: null });
                });
                
                // Adds the read stream to the read streams map
                this.readStreams.set(uploadPath, {
                    stream: readStream,
                    hostUploadPath: hostUploadPath
                });

                // For Android, a read from read stream is done manually
                if (globalProps.platform == 'Android') readStream.read();
            } catch (error) {
                // What to do if the platform is Android
                if (globalProps.platform == 'Android') {
                    try {
                        // Destroys the readStream
                        readStream.destroy();
                    } catch (error) { }
                    // Cancels the upload host-sided
                    socket.emit('cancel upload', uploadPath, true);
                }
            }
        });

        // The host emits this event when he successfully got a file chunk
        socket.on('host is ready to get the next file chunk', (uploadPath) => {
            try {
                /*
                    Checks if the uploadPath is exists within the read streams map before reading or resuming.
                    Without it, an error will be thrown saying that there is no object with uploadPath as key
                */
                if (!this.readStreams.has(uploadPath)) return;
                // The end date of each read iteration
                end = new Date();
                // Assigns the amount of seconds between the start date and end date to the time object
                time = ((end.getTime() - start.getTime()) / 1000);
                // Uses the read next file chunk function depending on the platform
                if (globalProps.platform == 'Android') this.readStreams.get(uploadPath).stream.read();
                else if (globalProps.platform == 'Computer') this.readStreams.get(uploadPath).stream.resume();
            } catch (error) {
                console.log(error);
            }
        });

        // This event emits whenever the file upload canceled or an error occurred
        socket.on('upload cancelled', async (uploadPath) => {
            try {
                // Destroys the read stream
                await this.destroyReadStream(uploadPath, false);
                // Resets mbps and time values to default
                mbps = 0;
                time = null;
                // Removes the first uploaded file from filesToUpload array
                this.filesToUpload.splice(0, 1);
                // If there is more files to upload, upload the next one
                if (this.filesToUpload.length > 0) {
                    this.setState({ progress: 0, mbps: 0, time: null });
                    // Waits 0.2ms to let the progress modal fully reset
                    await sleep(200);
                    // Uploads the next file in the list
                    this.uploadFileToHost();
                }
                else this.setState({ renderProgress: false, mbps: 0, time: null });
            } catch (error) {
                console.log(error);
            }
        });

        // If the client has no access viewing a directory, the host emits this event to inform him
        socket.on('show permission denied toast', () => {
            Toast.show({ description: 'Permission denied!' });
        });

        // The preview of a file that a client requested to
        socket.on('host file preview', (file, path, mimeType, type) => {
            // If the file is not in the cache, adds it to the cache (used to require the client to request the file from the host only once in a session)
            if (!this.cachedFiles.has(path) || this.cachedFiles.get(path).file != file) {
                this.cachedFiles.set(path, {
                    type: type,
                    file: file
                });
            }
            // Updates the state with the appropriate preview values
            this.setState({ fileType: type, showPreview: true, filePreview: file, fileMimeType: mimeType });
        });

        /*
            Any message from the host is received at this event.
            I had a problem with this particular event that a message was received multiple of times.
            Unlistening and relistening the event fixed the issue
        */
        socket.off('message from host').on('message from host', (state, fileName?) => {
            // File download/upload cancellation message
            if (state == 'cancel') {
                Toast.show({ description: `${capitalizeFirstLetter(this.state.operation.replace('ing', ''))} of ${fileName} cancelled!` });
                this.setState({ file: null });
            }
            // Host reconnection message
            else if (state == 'reconnect') Toast.show({ description: 'Host reconnected!' });
            // Host disconnection message
            else if (state == 'disconnect') {
                Toast.show({ description: 'Host disconnected!' });
                socket.off('message from host');
            }
        });

        // There is an event at the Computer App.tsx file which sends the window dimensions on resize and updates them accordingly to fit the element to the window
        if (globalProps.platform == 'Computer') {
            socket.on('update dimensions', (dimensions) => {
                this.setState({ width: dimensions.width, height: dimensions.height });
            });
        }

        // For Android, treat back button as go one folder back
        if (globalProps.platform == 'Android') BackHandler.addEventListener('hardwareBackPress', this.onBackPress);

        // If the file list is empty, requests the available storages from the host
        if (this.state.files.length == 0) socket.emit('get host storages');
    }

    // What to do when this component is unloaded
    async componentWillUnmount() {
        // Resets the state
        this.setState({});
        try {
            // Iterates each read stream within the read streams map and destroys it
            this.readStreams.forEach(async (value, uploadPath) => {
                await (async () => {
                    return new Promise<void>(async (resolve, reject) => {
                        await this.destroyReadStream(uploadPath, false);
                        resolve();
                    });
                })();
            });

            // Iterates each write stream within the write streams map and destroys it
            this.writeStreams.forEach(async (value, savePath) => {
                await (async () => {
                    return new Promise<void>(async (resolve, reject) => {
                        await this.destroyWriteStream(savePath, true, false);
                        resolve();
                    });
                })();
            });
            // Clears the read streams map, write streams map and cached files map
            this.readStreams.clear();
            this.writeStreams.clear();
            this.cachedFiles.clear();
        } catch (error) {
            console.log(error);
        }
        
        // Unlistens all the events
        socket.off('host storages');
        socket.off('host files');
        socket.off('start write stream session');
        socket.off('host file chunk');
        socket.off('host file downloaded');
        socket.off('download cancelled');
        socket.off('start uploading file to host');
        socket.off('host is ready to get the next file chunk');
        socket.off('upload cancelled');
        socket.off('show permission denied toast');
        socket.off('host file preview');
        if (globalProps.room) socket.off('message from host');
        if (globalProps.platform == 'Computer') {
            socket.off('update dimensions');
        }

        // Resets the Android back button action to default
        if (globalProps.platform == 'Android') BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    }

    // For every press on the first item in the file list, go one folder back
    onBackPress() {
        this.onFilePress('..', this.state.previousPath, 'folder');
        return true;
    }

    // make the host give the file preview for you
    async onFilePress(nameA: string, pathA: string, type: string) {
        // If the file has no path, return
        if (!pathA) return;
        // If the first character of the path is '/', slice it
        if (pathA[0] == '/') pathA = pathA.substring(1);
        // If there is any indication that the path is the first main directory of the drive/sdcard, show storage list
        if ((pathA == 'storage' || pathA == 'storage/emulated') || (nameA == '..' && this.state.previousPath && this.state.path && (this.state.previousPath == this.state.path || this.state.previousPath + '/' == this.state.path)))
            return this.getStorages();
        // Fixes the pathA value on Android
        if (globalProps.platform == 'Android') {
            if (pathA.includes('\\/')) {
                pathA = pathA.replace(/\\\//, '/');
            }
            if (pathA.includes('//')) {
                pathA = pathA.replace(/\/\//, '/');
            }
            if (pathA.split('/').length == 1) {
                pathA += '/';
            }
        // Resolves the pathA value on Computer
        } else if (globalProps.platform == 'Computer' && !pathA.startsWith('storage')) pathA = path.resolve(pathA).replace(/\\/g, '/');
        // If the pressed file item type is a storage or a folder prepare to read from it
        if (type == 'storage' || type == 'folder') {
            if (globalProps.platform == 'Android') {
                // Gets the path before the read by splitting the pathA value by '/', removing its last elemnt and merging all the elements by '/'
                const previousPathArray: Array<String> = pathA.split('/');
                previousPathArray.pop();
                const previousPath = previousPathArray.join('/');
                this.readDirectory(previousPath, pathA);
            } else if (globalProps.platform == 'Computer') {
                // If the pathA value starts with "storage", the host platform is Android. Else, the host platform is Computer
                var isAndroid = pathA.startsWith('storage');
                // Gets the path before the read by splitting the pathA value by '/', removing its last elemnt and merging all the elements by '/'
                const previousPathArray: Array<String> = pathA.split('/');
                if (previousPathArray.length > 0) previousPathArray.pop();
                var previousPath = previousPathArray.join('/');
                // Add a '/' at the end of the previous path if the platform is not Android
                if (!isAndroid) previousPath += '/';
                this.readDirectory(previousPath, pathA);
            }
        // If the type is a file, checks if the pressed file is previewable. If so, shows a preview of it
        } else if (type == 'file') {
            const mimeType = mime.lookup(pathA).toString();
            const fileType = mimeType.split('/')[0];
            if (filePreviewTypes.includes(fileType)) {
                this.setState({ showPreview: true });
                if (this.cachedFiles.has(pathA)) this.setState({ fileType: fileType, filePreview: this.cachedFiles.get(pathA).file, fileMimeType: mimeType });
                else socket.emit('get file to preview from host', pathA);
            }
        }
    }

    // Get host storages function
    async getStorages() {
        socket.emit('get host storages');
    }

    // Get the value of the showPreview state section
    getPreviewState() {
        return this.state.showPreview;
    }

    // Closes preview modal if the value of the showPreview state section is true
    updatePreviewState() {
        if (this.state.showPreview) this.setState({ fileType: null, showPreview: false, filePreview: null, fileMimeType: null });
    }

    // Read host directory files function
    async readDirectory(previousPath, dirPath) {
        socket.emit('get host files', previousPath, dirPath);
    }

    /*
        Download files from the host function.
        If the save directory object value has a path (which means that this is not the first file downloaded from the selectedFiles array),
        downloads the first file in the list to that path.
        Else, opens a save window for the user to select the path where to download all the files
    */
    async downloadFileFromHost() {
        if (this.state.selectedFiles.length == 0) return;
        const file = this.state.selectedFiles[0];
        if (file.type == 'storage' || file.type == 'folder') return;
        var savePath;
        if (!this.saveDirectory) {
            if (globalProps.platform == 'Android') {
                try {
                    const dir = await DocumentPicker.pickDirectory();
                    const uri = dir.uri;
                    savePath = await AndroidFs.uriToPath(uri);
                } catch (error) {
                    this.setState({ selectedFiles: [] });
                    if (this.state.renderProgress) this.setState({ renderProgress: false });
                    return;
                }
            } else if (globalProps.platform == 'Computer') {
                const dir = await window['electron'].dialog.showSaveDialog({ defaultPath: file.name });
                if (!dir.canceled) {
                    const filePath = path.resolve(dir.filePath).replace(/\\/g, '/');
                    const filePathArray = filePath.split('/');
                    filePathArray.pop();
                    savePath = filePathArray.join('/');
                }
                else {
                    this.setState({ selectedFiles: [] });
                    if (this.state.renderProgress) this.setState({ renderProgress: false });
                    return;
                }
            }
            if (!savePath) return;
            this.saveDirectory = savePath;
        }

        var duplicates: Array<any> = [];
        var checkDuplicates = false;
        var fileName = file.name;
        var duplicateNumber = 0;
        const fileNameArray = file.name.split('.');
        const targetFileExtension = fileNameArray.pop();
        const targetFileName = fileNameArray.join('.');
        const duplicateRegex = /(.*)( )?(\(([1-9]+)\))?/
        if (globalProps.platform == 'Android') {
            const files = await fs.readDir(this.saveDirectory);
            checkDuplicates = files.find(x => x.name == file.name) != undefined;
            if (checkDuplicates) {
                files.forEach(x => {
                    const splittedFileName = x.name.split('.');
                    const fileExtension = splittedFileName.pop();
                    const fileName = splittedFileName.join('.');
                    const fileRegexDetails = duplicateRegex.exec(fileName);
                    if (!fileRegexDetails) return;
                    const includesDuplicate = fileRegexDetails[1] == targetFileName && fileExtension == targetFileExtension;
                    if (includesDuplicate) duplicates.push(fileRegexDetails[fileRegexDetails.length - 1]);
                });
            }
        } else if (globalProps.platform == 'Computer') {
            const files = fs.readdirSync(this.saveDirectory);
            checkDuplicates = files.find(x => x == file.name) != undefined;
            if (checkDuplicates) {
                files.forEach(x => {
                    const splittedFileName = x.split('.');
                    const fileExtension = splittedFileName.pop();
                    const fileName = splittedFileName.join('.');
                    const fileRegexDetails = duplicateRegex.exec(fileName);
                    if (!fileRegexDetails) return;
                    const includesDuplicate = fileRegexDetails[1] == targetFileName && fileExtension == targetFileExtension;
                    if (includesDuplicate) duplicates.push(fileRegexDetails[fileRegexDetails.length - 1]);
                });
            }
        }

        if (duplicates.length > 0) {
            duplicates.sort();
            for (const number of duplicates) {
                if (number - duplicateNumber == 1) duplicateNumber++;
                else {
                    duplicateNumber++;
                    break;
                }
            }
            if ((duplicateNumber == duplicates.length && duplicates[duplicates.length - 1] == duplicateNumber)) duplicateNumber++;
            fileName = `${targetFileName} (${duplicateNumber}).${targetFileExtension}`;
        }

        socket.emit('download file from host', file.name, file.path, this.saveDirectory + '/' + fileName);
    }

    /*
        Upload files from the host function.
        If the filesToUpload array is empty, opens a file selection window for the user to select files to upload.
        Else, just uploads the first file in the list
    */
    async uploadFileToHost() {
        if (this.filesToUpload.length == 0) {
            if (globalProps.platform == 'Android') {
                try {
                    const files = await DocumentPicker.pickMultiple();
                    for (const file of files) {
                        const uri = file.uri.replace('raw:', '');
                        const fileStats = await rnfs.fs.stat(uri);
                        const filePath = fileStats.path;
                        fileStats.name = path.basename(filePath);
                        this.filesToUpload.push(fileStats);
                    }
                } catch (error) {
                    this.filesToUpload = [];
                    if (this.state.renderProgress) this.setState({ renderProgress: false });
                    return;
                }
            } else if (globalProps.platform == 'Computer') {
                const fileDialogData = await window['electron'].dialog.showOpenDialog({ properties: ['openFile', 'dontAddToRecent', 'multiSelections'] });
                if (!fileDialogData.canceled) {
                    for (var filePath of fileDialogData.filePaths) {
                        const fileStats = fs.lstatSync(filePath);
                        fileStats.name = path.basename(filePath);
                        fileStats.path = filePath.replace(/\\/g, '/');
                        this.filesToUpload.push(fileStats);
                    }
                } else {
                    this.filesToUpload = [];
                    if (this.state.renderProgress) this.setState({ renderProgress: false });
                    return;
                }
            }
        }
        socket.emit('upload file to host', this.filesToUpload[0].name, this.filesToUpload[0].size, this.filesToUpload[0].path, this.state.path);
    }

    // Cancel file download function
    cancelDownload() {
        socket.emit('cancel download', this.saveDirectory + '/' + this.state.selectedFiles[0].name, true);
    }

    // Cancel file upload download
    cancelUpload() {
        const streamData = this.readStreams.get(this.filesToUpload[0].path);
        const hostUploadPath = streamData.hostUploadPath;
        socket.emit('cancel upload', this.filesToUpload[0].path, hostUploadPath, true);
    }

    // Used as a helper function for the BigList component
    renderList({ item, index }) {
        return <FileItem file={item} index={index} state={this.state} selected={this.state.selectedFiles.some(file => file.path == item.path)} setState={this.setState} onFilePress={this.onFilePress} />
    }

    // Destroy read stream function
    destroyReadStream(uploadPath, shouldEmitToHost) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (!this.readStreams.has(uploadPath)) resolve();
                const streamData = this.readStreams.get(uploadPath);
                if (!streamData) resolve();
                if (streamData.stream.destroyed || streamData.stream.destroyed == undefined) {
                    try {
                        streamData.destroy();
                    } catch (error) { }
                }
                const hostUploadPath = streamData.hostUploadPath;
                this.readStreams.delete(uploadPath);
                if (shouldEmitToHost) socket.emit('cancel upload', uploadPath, hostUploadPath, false);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Destroy write stream function
    destroyWriteStream(savePath, shouldDeleteFile, shouldEmitToHost) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (!this.writeStreams.has(savePath)) resolve();
                const streamData = this.writeStreams.get(savePath);
                if (!streamData) resolve();
                if (!streamData.stream.destroyed || streamData.stream.destroyed == undefined) {
                    try {
                        streamData.stream.destroy();
                    } catch (error) { }
                }
                if (shouldDeleteFile) {
                    setTimeout(async () => {
                        try {
                            if (globalProps.platform == 'Android') {
                                if (await fs.exists(savePath)) {
                                    await fs.unlink(savePath);
                                }
                            } else if (globalProps.platform == 'Computer') {
                                if (fs.existsSync(savePath)) {
                                    fs.unlinkSync(savePath);
                                }
                            }
                        } catch (error) { }
                    }, 1); // sometimes the exists check running before the file being created, and not deleting the file
                }
                this.writeStreams.delete(savePath);
                if (shouldEmitToHost) socket.emit('cancel download', savePath, false);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    render() {
        return (
            <>
                {globalProps.platform == 'Computer' && <ContextMenu state={this.state} downloadFileFromHost={this.downloadFileFromHost} setState={this.setState} />}
                <Modal _backdrop={{
                    style: {
                        width: this.state.width,
                        height: globalProps.platform == 'Computer' ? this.state.height - 30 : this.state.height
                    }
                }} isOpen={this.state.renderProgress} size={'md'}>
                    <Modal.Content backgroundColor={'#383838'}>
                        <Modal.Header>{this.state.operation && `${capitalizeFirstLetter(this.state.operation)} File...`}</Modal.Header>
                        <Modal.Body>
                            <Center>
                                <VStack space={2}>
                                    <Progress.Circle
                                        showsText={true}
                                        size={150}
                                        progress={this.state.progress}
                                        borderWidth={0}
                                        color='#ffffff'
                                        fill='rgba(0, 0, 0, 0)'
                                        unfilledColor='rgb(20, 20, 20)'
                                        animated={true}
                                    />
                                    <VStack>
                                        <Text alignSelf={'center'}>Will finish in: {this.state.time}</Text>
                                        <Text alignSelf={'center'}>{this.state.mbps > 0 && formatBytes(this.state.mbps)}</Text>
                                    </VStack>
                                    {this.state.progress < 1 && <Button onPress={this.state.operation == 'downloading' ? this.cancelDownload : this.cancelUpload}>Cancel</Button>}
                                </VStack>
                            </Center>
                        </Modal.Body>
                    </Modal.Content>
                </Modal>
                {this.state.showPreview && <FilePreview fileType={this.state.fileType} maxToRenderPerBatch={1} fileMimeType={this.state.fileMimeType} filePreview={this.state.filePreview} showPreview={this.state.showPreview} updatePreviewState={this.updatePreviewState} />}
                <View flex={1}>
                    <BigList itemHeight={39} ref={(e) => this.flatListViewRef = e} data={this.state.files} renderItem={this.renderList} keyExtractor={(item, index) => item.name} indicatorStyle='white' style={
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
                    {this.state.path && <Button onPress={this.uploadFileToHost} style={{
                        //display: this.flatListViewRef?.state.batchSize == 0 ? 'none' : undefined,
                        margin: 25,
                        position: 'absolute',
                        bottom: 0,
                        borderTopRightRadius: 100,
                        borderBottomRightRadius: 100,
                        backgroundColor: 'gray'
                    }}>Upload</Button>}

                    {this.state.selectedFiles.length > 0 && <Button onPress={() => this.setState({ selectedFiles: [] })} style={{
                        display: this.flatListViewRef?.state.batchSize == 0 ? 'none' : undefined,
                        margin: 25,
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        borderTopLeftRadius: 100,
                        borderBottomLeftRadius: 100,
                        backgroundColor: 'gray'
                    }}>Deselect All Files</Button>}

                    {globalProps.platform == 'Android' && this.state.selectedFiles.length > 0 && <Button onPress={this.downloadFileFromHost} style={{
                        display: this.flatListViewRef?.state.batchSize == 0 ? 'none' : undefined,
                        margin: 25,
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        borderTopLeftRadius: 100,
                        borderBottomLeftRadius: 100,
                        backgroundColor: 'gray'
                    }}>Download</Button>}

                    {/*globalProps.platform == 'Computer' && (
                        <View style={{
                            margin: 25,
                            borderTopLeftRadius: 25,
                            borderBottomLeftRadius: 25,
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            alignSelf: 'center',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} pointerEvents='none'>

                        </View>
                    )*/}
                </View>
            </>
        )
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Calculates the size of a base64 file chunk as bytes
function getChunkSize(chunk) {
    // An object used to store the padding value
    var padding;
    // If the chunk ends with "==", the padding value will be 2
    if (chunk.endsWith('==')) padding = 2;
    // If the chunk ends with "=", the padding value will be 1
    else if (chunk.endsWith('=')) padding = 1;
    // In any other case, the padding value will be 3
    else padding = 3;
    /*
        This object indicates the mbps of the file chunk.
        There are 3 elements used to calculate it:
            1. The length of the string containing the file chunk
            2. 3 / 4 means 3 bytes of data for every 4 base64 encoded characters. This is the ratio of the base64 encode itself, not only for the file chunks
            3. Subtracted by the padding value calculated earlier
    */
    return (chunk.length * (3 / 4)) - padding;
}

export default ClientFiles;