import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host file preview',
    listener: async (io: Server, socket: Socket, clientId: string, file: string, path: string, mimeType: string, type: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host file preview', file, path, mimeType, type);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}