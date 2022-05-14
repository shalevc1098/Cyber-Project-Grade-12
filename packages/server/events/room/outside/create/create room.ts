import { Server, Socket } from 'socket.io';
import { CreateRoomInput } from '../../../../interfaces/Room';
import { addUserToRoom, createRoom } from '../../../../operations/room-operations';
import generateID from '../../../../generateID';

export default {
    name: 'create room',
    listener: async (io: Server, socket: Socket, roomName: string, roomPassword: string, roomDescription: string, maxUsers: string) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            if (socket.data.room) throw new Error('You are already in a room!');
            const roomId = generateID();
            const roomData: CreateRoomInput = {
                id: roomId.toString(),
                roomHost: socket.data.user.username,
                roomName: roomName,
                roomPassword: roomPassword,
                roomCreationDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                roomDescription: roomDescription,
                maxUsers: parseInt(maxUsers),
                hostId: socket.data.user.id,
                connectedUsers: []
            }
            const {connectedUsers, ...room} = await createRoom(roomData);
            await addUserToRoom(room.id, room.hostId, socket.id);
            socket.data.room = room;
            socket.data.room.isHost = true;
            if (socket.rooms.has('room list')) socket.leave('room list');
            await socket.data.events.unlistenCategory('room', 'outside');
            await socket.data.events.unlistenCategory('room', 'outside', 'create');
            await socket.data.events.unlistenCategory('room', 'outside', 'list');

            await socket.data.events.listenCategory('room', 'inside');
            await socket.data.events.listenCategory('room', 'inside', 'host');
            socket.join(room.id);
            socket.emit('room data', socket.data.room);
            io.to('room list').emit('update room list');
        } catch (error) {
            socket.emit('room error', error.message);
            console.log(error);
        }
    }
}