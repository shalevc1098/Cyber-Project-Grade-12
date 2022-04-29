import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'tell the host that the client is ready to get the next file chunk',
    listener: async (io: Server, socket: Socket, savePath: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('client is ready to get the next file chunk', socket.data.user.id, savePath);
        } catch (error) {
            console.log(error);
        }
    }
}