import { io } from 'socket.io-client';
import * as client from 'socket.io-client';

class Socket {
    private ip: string;
    private port: number;
    private type: string;
    private options: object;
    constructor(ip: string, port: number, type: string, options = {}) {
        this.ip = ip;
        this.port = port;
        this.type = type;
        this.options = options;
    }
    connect() {
        return new Promise(async (resolve, reject) => {
            const socket = io(this.type + '://' + this.ip + ":" + this.port, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 1000,
                reconnectionAttempts: Infinity,
                autoConnect: true,
                ...this.options
            });

            socket.on('connect', () => {
                resolve(socket);
            });
        });
    }
}

export default Socket;

/*
1. Server, give me list of hosts available
2. Server goes to array of hosts
3. Server sends the array to Android
4. Android displays the data
*/

/*
socket.on('give hosts', () => {
    socket.emit('hosts reponse', hosts from graphql);
});

socket.emit('give hosts', (hosts) => {
    parse the hosts to the web
});
*/