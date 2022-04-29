import React from 'react';
import { Toast } from 'native-base';
import path from 'path';
import mime from 'mime-types';
const fs = window.require('fs');
const drivelist = window.require('drivelist');
const sharp = window.require('sharp');

export function getStorages() {
    return new Promise<any[]>(async (resolve, reject) => {
        const connectedDrives: Array<any> = [];
        const drives = await drivelist.list();
        drives.forEach((drive) => {
            drive.mountpoints.forEach(mountpoint => {
                connectedDrives.push({
                    name: mountpoint.path,
                    path: mountpoint.path.replace(/\\/g, '/'),
                    size: drive.size,
                    type: 'storage', icon: {
                        type: 'icon',
                        name: 'folder',
                        size: 25
                    }
                })
            });
        });
        sortFilesByABC(connectedDrives);
        resolve(connectedDrives);
    });
}

export function readDirectory(previousPath, dirPath, cachedImages) {
    return new Promise<any[]>((resolve, reject) => {
        fs.readdir(dirPath, async (err, files) => {
            if (err) reject(err);
            const directories: Array<any> = [];
            const data: Array<any> = [];
            for (const file of files) {
                try {
                    const fileStats = fs.lstatSync(path.resolve(dirPath, file));
                    fileStats.isDirectory()
                        ?
                        directories.push({
                            name: file, path: `${dirPath}/${file}`, size: '0', type: 'folder', icon: {
                                type: 'icon',
                                name: 'folder',
                                size: 25
                            }
                        })
                        :
                        await (async () => {
                            var icon;
                            const filePath = path.resolve(dirPath, file).replace(/\\/g, '/');
                            const mimeType = mime.lookup(filePath).toString().split('/');
                            const fileType = mimeType[0];
                            if (fileType == 'image') {
                                if (!cachedImages.has(filePath)) {
                                    const mimeType = mime.lookup(filePath).toString();
                                    const base64Img = Buffer.from(await sharp(filePath).resize(25, 25).toBuffer()).toString('base64');
                                    icon = {
                                        type: 'image',
                                        uri: `data:${mimeType};base64,${base64Img}`,
                                        width: 25,
                                        height: 25
                                    }
                                    cachedImages.set(filePath, `data:${mimeType};base64,${base64Img}`);
                                } else {
                                    icon = {
                                        type: 'image',
                                        uri: cachedImages.get(filePath),
                                        width: 25,
                                        height: 25
                                    }
                                }
                            } else if (fileType == 'audio') {
                                icon = {
                                    type: 'icon',
                                    name: 'file-sound-o',
                                    size: 25
                                }
                            } else {
                                icon = {
                                    type: 'icon',
                                    name: 'file',
                                    size: 25
                                }
                            }
                            data.push({ name: file, path: filePath, size: fileStats.size, type: 'file', icon: icon });
                        })()
                } catch (error) {
                    //reject(error);
                }
            }
            sortFilesByABC(directories);
            sortFilesByABC(data);
            const allFiles = [{ ctime: undefined, mtime: undefined, name: '..', path: previousPath, size: 0, type: 'folder' }, ...directories, ...data];
            resolve(allFiles);
        });
    });
}

export async function sendFileToServer(socket, state, readStreams, setState) {
    return new Promise<void>(async (resolve, reject) => {
        const fileStats = fs.statSync(state.file.path);
        const fileName = state.file.path.split('/').pop();
        const size = fileStats.size;
        const bufferSize = (1024 * 1000) * 10;
        var current = 0;
        setState({ progress: current, renderProgress: true });
        var total = Math.trunc(size / bufferSize) + 1; // readStream.readableHighWaterMark
        socket.emit('delete file if exists', fileName);
        socket.emit('start receiving file', fileName, state.filePath, total);

        const readStream = fs.createReadStream(state.file.path, {
            highWaterMark: bufferSize
        });

        readStreams.push(readStream);

        readStream.on('data', async (chunk) => {
            socket.emit('chunk', fileName, chunk, 'Computer');
            setState({ progress: current++ / total });
            readStream.pause();
            await sleep(250);
            readStream.resume();
        });

        readStream.on('end', () => {
            setState({ progress: current / total });
            Toast.show({ description: 'File sent!' });
            readStreams.splice(readStreams.indexOf(readStream), 1);
            readStream.destroy();
        });

        readStream.on('close', async () => {
            await sleep(500);
            setState({ renderProgress: false });
            resolve();
        });
    });
}

function sortFilesByABC(files) {
    files.sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}