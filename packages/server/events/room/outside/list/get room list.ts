import { Server, Socket } from 'socket.io';
import { getRooms } from '../../../../operations/room-operations';

export default {
    name: 'get room list',
    listener: async (io: Server, socket: Socket) => {
        try {
            const rooms = await getRooms();
            const roomList = [];
            rooms.forEach(room => {
                if (room.connectedUsers.length >= room.maxUsers + 1 || socket.data.user.id == room.hostId) return;
                const { roomPassword, connectedUsers, ...roomData } = room;
                roomList.push(roomData);
            });
            if (!socket.rooms.has('room list')) socket.join('room list');
            socket.emit('room list', roomList);
        } catch (error) {
            console.log(error);
        }
    }
}