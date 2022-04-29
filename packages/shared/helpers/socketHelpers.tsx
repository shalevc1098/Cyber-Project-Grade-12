import { Socket } from 'socket.io-client';

export const emitLocally = (socket: Socket, event: String, ...args: any) => {
    const callbacks = socket["_callbacks"]['$' + event];
    for(const callback of callbacks) {
        callback.apply(socket, args);
    }
};