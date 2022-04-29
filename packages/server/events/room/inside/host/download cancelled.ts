import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'download cancelled',
    listener: async (io: Server, socket: Socket, clientId: string, savePath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('download cancelled', savePath);
        } catch (error) {
            console.log(error);
        }
    }
}