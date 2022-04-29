import { Server, Socket } from 'socket.io';

class Event {
    io: Server
    socket: Socket;
    name: string;
    listener: (io: Server, socket: Socket, ...args: any) => void;
    constructor (io: Server, socket: Socket, name: string, listener: (io: Server, socket: Socket, ...args: any) => void) {
        this.io = io;
        this.socket = socket;
        this.name = name;
        this.listener = listener;
        this.realListener = this.realListener.bind(this);
    }

    listen() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                this.socket.on(this.name, this.realListener);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    unlisten() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                this.socket.off(this.name, this.realListener);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    private realListener(...args) {
        this.listener(this.io, this.socket, ...args);
    }
}

export default Event;