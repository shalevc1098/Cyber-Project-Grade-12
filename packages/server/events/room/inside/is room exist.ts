import { Server, Socket } from 'socket.io';
import { isRoomExist } from '../../../operations/room-operations';

export default {
    name: 'is room exist',
    listener: async (io: Server, socket: Socket) => {
        try {
            socket.emit('is room exist', await isRoomExist(socket.data.room.id));
        } catch (error) {
            console.log(error);
        }
    }
}