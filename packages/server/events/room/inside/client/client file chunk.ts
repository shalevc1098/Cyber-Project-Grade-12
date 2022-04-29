import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'client file chunk',
    listener: async (io: Server, socket: Socket, chunk: string, uploadPath: string, hostUploadPath: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('client file chunk', socket.data.user.id, chunk, uploadPath, hostUploadPath);
        } catch (error) {
            console.log(error);
        }
    }
}