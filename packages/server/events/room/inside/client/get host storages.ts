import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'get host storages',
    listener: async (io: Server, socket: Socket) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('get storages', socket.data.user.id);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}