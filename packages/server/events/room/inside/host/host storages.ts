import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host storages',
    listener: async (io: Server, socket: Socket, clientId: string, storages: any) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host storages', storages);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}