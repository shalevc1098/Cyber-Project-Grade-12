import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'get host files',
    listener: async (io: Server, socket: Socket, previousPath: string, dirPath: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('get files', socket.data.user.id, previousPath, dirPath);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}