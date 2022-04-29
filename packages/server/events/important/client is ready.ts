import { Server, Socket } from 'socket.io';

export default {
    name: 'client is ready',
    listener: async (io: Server, socket: Socket) => {
        try {
            socket.emit('set data');
        } catch (error) {
            console.log(error);
        }
    }
}