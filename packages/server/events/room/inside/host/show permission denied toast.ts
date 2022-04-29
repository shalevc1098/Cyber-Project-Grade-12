import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'show permission denied toast',
    listener: async (io: Server, socket: Socket, clientId: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('show permission denied toast');
        } catch (error) {
            console.log(error);
        }
    }
}