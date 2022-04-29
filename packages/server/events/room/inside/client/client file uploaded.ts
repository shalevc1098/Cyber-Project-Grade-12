import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'client file uploaded',
    listener: async (io: Server, socket: Socket, hostUploadPath: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('client file uploaded', socket.data.user.id, hostUploadPath, socket.data.user.username);
        } catch (error) {
            console.log(error);
        }
    }
}