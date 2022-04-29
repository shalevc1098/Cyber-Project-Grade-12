import { Server, Socket } from 'socket.io';
import { getConnectedUsers, isRoomExist } from '../../../operations/room-operations';

export default {
    name: 'get connected users',
    listener: async (io: Server, socket: Socket) => {
        try {
            const roomId = socket.data.room.id;
            if (!(await isRoomExist(roomId))) throw new Error('Room does not exist!');
            const connectedUsers = await getConnectedUsers(roomId);
            const usernames = connectedUsers.map(user => user.username);
            io.to(roomId).emit('update connected users', usernames);
        } catch (error) {
            socket.emit('room error', error.message);
            console.log(error);
        }
    }
}