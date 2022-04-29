import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host file downloaded',
    listener: async (io: Server, socket: Socket, clientId: string, savePath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host file downloaded', savePath);
        } catch (error) {
            console.log(error);
        }
    }
}