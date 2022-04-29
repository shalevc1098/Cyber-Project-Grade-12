import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host files',
    listener: async (io: Server, socket: Socket, clientId: string, files: any, previousPath: string, dirPath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host files', files, previousPath, dirPath);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}