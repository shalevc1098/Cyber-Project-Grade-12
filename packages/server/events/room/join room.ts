import { Server, Socket } from 'socket.io';
import { addUserToRoom, getRoom, getUserFromRoom, isRoomExist } from '../../operations/room-operations';

export default {
    name: 'join room',
    listener: async (io: Server, socket: Socket, roomId: string, roomPassword: string) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            if (!(await isRoomExist(roomId))) throw new Error('Room does not exist!');
            if (socket.data.room) throw new Error('You are already in a room!');
            const {connectedUsers, ...room} = await getRoom(roomId);
            if (room.roomPassword != roomPassword) return socket.emit('incorrect room password');
            if (connectedUsers.length >= room.maxUsers + 1) throw new Error('Room is full!');
            await addUserToRoom(roomId, socket.data.user.id, socket.id);
            socket.data.room = room;
            socket.data.room.isHost = false;
            if (socket.rooms.has('room list')) socket.leave('room list');
            await socket.data.events.unlistenCategory('room', 'outside');
            await socket.data.events.unlistenCategory('room', 'outside', 'create');
            await socket.data.events.unlistenCategory('room', 'outside', 'list');
            
            await socket.data.events.listenCategory('room', 'inside');
            await socket.data.events.listenCategory('room', 'inside', 'client');
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('add client to streams map', socket.data.user.id);
            socket.to(host.socketId).emit('get storages', socket.data.user.id);
            socket.join(roomId);
            if (socket.rooms.has(`${roomId}-waiting`)) {
                socket.leave(`${roomId}-waiting`);
                socket.emit('reload app');
            } else socket.emit('room data', socket.data.room);
            const usernames = connectedUsers.map(user => user.username);
            io.to(roomId).emit('update connected users', usernames);
            socket.to('room list').emit('update room list');
        } catch (error) {
            if (socket.rooms.has(`${roomId}-waiting`)) {
                socket.leave(`${roomId}-waiting`);
                socket.emit('incorrect data', 'room', 'You are now not waiting for any room!');
                socket.emit('reload app');
            }
            socket.emit('room error', error.message);
            console.log(error);
        }
    }
}