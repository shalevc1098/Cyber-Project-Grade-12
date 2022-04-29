import { EmitterSubscription, NativeEventEmitter, NativeModules } from 'react-native';

const eventEmitter = new NativeEventEmitter(NativeModules.AndroidFs);
const events = new Map<string, Map<string, EmitterSubscription>>();

const allowdReadEvents = ['close', 'data', 'end'];
const allowdWriteEvents = ['close'];

export const createReadStream = (path, options?) => {
    const id = `RS${getId()}`;
    var destroyed = false;
    events.set(id, new Map<string, EmitterSubscription>());
    const endEvent = eventEmitter.addListener(`${id}end`, () => {
        setTimeout(() => {
            events.get(id)?.forEach(event => {
                event.remove();
            });
            events.delete(id);
            endEvent.remove();
        });
    });
    return {
        on: (event: string, callback: (data: any) => void) => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            if (!allowdReadEvents.includes(event)) return;
            events.get(id)?.set(event, eventEmitter.addListener(id + event, callback));
        },
        read: () => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            NativeModules.AndroidFs.readChunk(id, path, options.highWaterMark);
        },
        destroy: () => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            destroyed = true;
            NativeModules.AndroidFs.destroyReadStream(id);
            setTimeout(() => {
                events.get(id)?.forEach(event => {
                    event.remove();
                });
                events.delete(id);
                endEvent.remove();
            });
        }
    }
}

export const createWriteStream = (path) => {
    const id = `WS${getId()}`;
    var destroyed = false;
    events.set(id, new Map<string, EmitterSubscription>());
    const endEvent = eventEmitter.addListener(`${id}end`, () => {
        setTimeout(() => {
            events.get(id)?.forEach(event => {
                event.remove();
            });
            events.delete(id);
            endEvent.remove();
        });
    });
    return {
        on: (event: string, callback: (data: any) => void) => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            if (!allowdWriteEvents.includes(event)) return;
            events.get(id)?.set(event, eventEmitter.addListener(id + event, callback));
        },
        write: (chunk) => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            NativeModules.AndroidFs.writeChunk(id, path, chunk);
        },
        destroy: () => {
            if (destroyed) throw new Error('The stream is already destroyed!');
            destroyed = true;
            NativeModules.AndroidFs.destroyWriteStream(id);
            setTimeout(() => {
                events.get(id)?.forEach(event => {
                    event.remove();
                });
                events.delete(id);
                endEvent.remove();
            });
        }
    }
}

/**
 * 
 * @param path 
 * @param callback 
 * @returns 
 */

export const watch = async (path, callback: (event: string, file: string) => void): Promise<{ close: () => Promise<boolean> }> => {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const id = `W${getId()}`;
            await NativeModules.AndroidFs.watch(id, path);
            const watcherEvent = eventEmitter.addListener(id + path, (data) => callback(data.event, data.file));
            resolve({
                close: () => {
                    return new Promise<boolean>(async (resolve, reject) => {
                        try {
                            await NativeModules.AndroidFs.closeWatcher(id);
                            watcherEvent.remove();
                            resolve(true);
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

export const resize = (path, width, height) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            const resizedBase64 = await NativeModules.AndroidFs.resize(path, width, height);
            resolve(resizedBase64);
        } catch (error) {
            reject(error);
        }
    });
}

export const uriToPath = (uri: string): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
        uri = decodeURIComponent(uri);
        //console.log(uri);
        const pathRegex = uri.match(/content:\/\/.*\/(.*):(.*)/);
        if (!pathRegex) return reject('Invalid path!');
        var path;
        if (pathRegex[1] == 'primary') path = `/storage/emulated/0/${pathRegex[2]}`;
        else path = `/storage/${pathRegex[1]}/${pathRegex[2]}`;
        resolve(path);
    });
}

function getId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}