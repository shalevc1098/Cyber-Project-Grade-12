import { Server, Socket } from 'socket.io';
import Event from './Event';
import fs from 'fs/promises';
import path from 'path';

class Events {
    io: Server;
    socket: Socket;
    path: string;
    private events: Map<string, any>;
    constructor(io: Server, socket: Socket, path: string) {
        this.io = io;
        this.socket = socket;
        this.path = path;
        this.events = new Map();
    }

    init() {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                await this.initEvents();
                await this.listenCategory('important');
                await this.listenCategory('authorization', 'not logged');
                this.socket.data.events = this;
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    listenCategory(category: string, ...subCategory: string[]) {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                if (!this.events.has(category)) throw new Error(`${category} wasn't found!`);
                var events = this.events.get(category);
                if (subCategory.length > 0) {
                    await Promise.all(subCategory.map(field => {
                        events = events[field];
                        if (!events) throw new Error(`Sub category ${subCategory.join('/')} wasn't found within ${category}!`);
                    }));
                }
                const promises: Array<Promise<boolean>> = [];
                Object.keys(events).sort().forEach(event => {
                    if (events[event] instanceof Event) promises.push(events[event].listen());
                });
                await Promise.all(promises);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    unlistenCategory(category: string, ...subCategory: string[]) {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                if (!this.events.has(category)) throw new Error(`${category} wasn't found!`);
                var events = this.events.get(category);
                if (subCategory.length > 0) {
                    await Promise.all(subCategory.map(field => {
                        events = events[field];
                        if (!events) throw new Error(`Sub category ${subCategory.join('/')} wasn't found within ${category}!`);
                    }));
                }
                const promises: Array<Promise<boolean>> = [];
                Object.keys(events).sort().forEach(event => {
                    if (events[event] instanceof Event) promises.push(events[event].unlisten());
                });
                await Promise.all(promises);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    listenAll(subCategory?) {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const events = subCategory ? subCategory : this.events;
                const promises: Array<Promise<boolean>> = [];
                Object.keys(events).sort().forEach(async event => {
                    if (events[event] instanceof Event) {
                        promises.push(events[event].listen());
                        return;
                    }
                    await this.listenAll(events[event]);
                });
                await Promise.all(promises);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    unlistenAll(subCategory?) {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const events = subCategory ? subCategory : this.events;
                const promises: Array<Promise<boolean>> = [];
                Object.keys(events).sort().forEach(async event => {
                    if (events[event] instanceof Event) {
                        promises.push(events[event].unlisten());
                        return;
                    }
                    await this.unlistenAll(events[event]);
                });
                await Promise.all(promises);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    clear() {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                this.events.clear();
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async initEvents(location: string = this.path, current?: any) {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const eventsDirs = await fs.readdir(location);
                await Promise.all(eventsDirs.map(async file => {
                    const stats = await fs.stat(path.resolve(location, file));
                    if (stats.isDirectory()) {
                        if (current) current[file] = {};
                        else this.events.set(file, {});
                        return await this.initEvents(path.resolve(location, file), current ? current[path.basename(file, '.ts')] : this.events.get(path.basename(file, '.ts')));
                    } else if (stats.isFile()) {
                        const eventData = (await import(path.resolve(location, file))).default;
                        if (current) current[path.basename(file, '.ts')] = new Event(this.io, this.socket, eventData.name, eventData.listener);
                        else this.events.set(file, new Event(this.io, this.socket, eventData.name, eventData.listener));
                    }
                }));
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default Events;