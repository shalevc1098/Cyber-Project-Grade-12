import { Server, Socket } from 'socket.io';
import Room from '../../../../classes/Room';
import { deleteRoom, getRoom } from '../../../../operations/room-operations';

export default {
    name: 'delete room',
    listener: async (io: Server, socket: Socket) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            if (!socket.data.room) throw new Error('You are not in any room!');
            const room: Room = await getRoom(socket.data.room.id);
            if (room.hostId != socket.data.user.id) throw new Error('You can\'t delete a room that is not your\'s!');
            await deleteRoom(room.id);
            io.to(room.id).emit('leave room');
            io.to(`${room.id}-waiting`).emit('leave room');
            io.to('room list').emit('update room list');
        } catch (error) {
            socket.emit('room error', error.message);
            console.log(error);
        }
    }
}