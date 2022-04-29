import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'tell the client that the host is ready to get the next file chunk',
    listener: async (io: Server, socket: Socket, clientId: string, uploadPath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host is ready to get the next file chunk', uploadPath);
        } catch (error) {
            console.log(error);
        }
    }
}