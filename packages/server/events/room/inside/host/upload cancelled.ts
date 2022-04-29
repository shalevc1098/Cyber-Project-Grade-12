import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'upload cancelled',
    listener: async (io: Server, socket: Socket, clientId: string, uploadPath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('upload cancelled', uploadPath);
        } catch (error) {
            console.log(error);
        }
    }
}