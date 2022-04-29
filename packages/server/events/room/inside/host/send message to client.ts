import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'send message to client',
    listener: async (io: Server, socket: Socket, clientId: string, state: string, fileName?: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('message from host', state, fileName);
        } catch (error) {
            console.log(error);
        }
    }
}