import React from 'react';
import { Toast } from 'native-base';
import { Image, NativeModules } from 'react-native';
import path from 'path';
import mime from 'mime-types';
import fs from 'react-native-fs';
import * as AndroidFs from 'shared/functions/Android/AndroidFs';

export function getStorages() {
    return new Promise<any[]>(async (resolve, reject) => {
        const info = await fs.getFSInfo();
        const storages = await fs.getAllExternalFilesDirs()
        const directories: Array<any> = [];
        for (var i = 0; i < storages.length; i++) {
            storages[i] = storages[i].substring(1).replace('/Android/data/com.mobile/files', '');
            const pathNameArray: Array<String> = storages[i].split('/');
            const dirName = pathNameArray[pathNameArray.length - 1]
            directories[i] = {
                name: dirName,
                path: storages[i],
                type: 'storage',
                size: storages[i].includes('emulated') ? [info.freeSpace, info.totalSpace] : [info['freeSpaceEx'], info['totalSpaceEx']],
                icon: {
                    type: 'icon',
                    name: 'folder',
                    size: 25
                }
            };
        }
        //this.setState({ files: directories, path: null, previousPath: null });
        resolve(directories);
    });
}

export function readDirectory(previousPath, dirPath, cachedImages) {
    return new Promise<any[]>(async (resolve, reject) => {
        try {
            const data: Array<any> = await fs.readDir(dirPath); // data represents all the files in dirPath
            const directories: Array<any> = [];
            const files: Array<any> = [];
            for (var i = 0; i < data.length; i++) {
                data[i] = {
                    ctime: data[i].ctime,
                    mtime: data[i].mtime,
                    name: data[i].name,
                    path: data[i].path,
                    size: data[i].size,
                    type: data[i].isDirectory() ? 'folder' : 'file',
                }
                if (data[i].type == 'folder') {
                    data[i] = {
                        ...data[i],
                        icon: {
                            type: 'icon',
                            name: data[i].type,
                            size: 25
                        }
                    }
                    pushFileToArray(data, i, directories);
                }
                else if (data[i].type == 'file') {
                    const baseName = path.basename(data[i].path);
                    const mimeType = mime.lookup(baseName).toString().split('/');
                    const fileType = mimeType[0];
                    if (fileType == 'image') {
                        try {
                            const mimeType = mime.lookup(data[i].path).toString();
                            const base64ResizedImg = await AndroidFs.resize(data[i].path, 25, 25);
                            data[i] = {
                                ...data[i],
                                icon: {
                                    type: 'image',
                                    uri: `data:${mimeType};base64,${base64ResizedImg}`,
                                    width: 25,
                                    height: 25
                                }
                            }
                        } catch (error) {
                            data[i] = {
                                ...data[i],
                                icon: {
                                    type: 'icon',
                                    name: data[i].type,
                                    size: 25
                                }
                            }
                        }
                    } else if (fileType == 'audio') {
                        data[i] = {
                            ...data[i],
                            icon: {
                                type: 'icon',
                                name: 'file-sound-o',
                                size: 25
                            }
                        }
                    } else {
                        data[i] = {
                            ...data[i],
                            icon: {
                                type: 'icon',
                                name: data[i].type,
                                size: 25
                            }
                        }
                    }
                    pushFileToArray(data, i, files);
                }
            }
            sortFilesByABC(directories);
            sortFilesByABC(files);
            const allFiles: Array<any> = [{ ctime: undefined, mtime: undefined, name: '..', path: previousPath, size: 0, type: 'folder', isFile: () => false }, ...directories, ...files];
            resolve(allFiles);
        } catch (error: any) {
            reject(error.message);
        }
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

function pushFileToArray(files, index, array) {
    array.push(files[index]);
}