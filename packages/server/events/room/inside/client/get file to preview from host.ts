import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'get file to preview from host',
    listener: async (io: Server, socket: Socket, path: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('get file to preview from host', socket.data.user.id, path);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}