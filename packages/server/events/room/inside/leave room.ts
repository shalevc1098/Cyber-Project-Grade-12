import { Server, Socket } from 'socket.io';
import Room from '../../../classes/Room';
import { getConnectedUsers, getUserFromRoom, isRoomExist, removeUserFromRoom } from '../../../operations/room-operations';

export default {
    name: 'leave room',
    listener: async (io: Server, socket: Socket) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            if (!socket.data.room) throw new Error('You are not in any room!');
            const room: Room = socket.data.room;
            /*
                im not using the getRoom function because if the host emitted this event,
                it means that the room was deleted before, and it will throw an error
            */
            await socket.data.events.unlistenCategory('room', 'inside');
            if (socket.data.room.isHost) await socket.data.events.unlistenCategory('room', 'inside', 'host');
            else await socket.data.events.unlistenCategory('room', 'inside', 'client');
            delete socket.data.room;
            socket.leave(room.id);
            socket.leave(`${room.id}-waiting`); // just in-case the client is waiting for the host to reconnect
            if (await isRoomExist(room.id)) {
                await removeUserFromRoom(room.id, socket.data.user.id);
                const host = await getUserFromRoom(room.id, room.hostId);
                socket.to(host.socketId).emit('remove client from streams map', socket.data.user.id);
                const connectedUsers = await getConnectedUsers(room.id);
                const usernames = connectedUsers.map(user => user.username);
                socket.to(room.id).emit('update connected users', usernames);
            }
            await socket.data.events.listenCategory('room', 'outside');
            await socket.data.events.listenCategory('room', 'outside', 'create');
            await socket.data.events.listenCategory('room', 'outside', 'list');
            if (socket.rooms.has('room list')) socket.leave('room list');
            socket.emit('reload app');
        } catch (error) {
            socket.emit('room error', error.message);
            console.log(error);
        }
    }
}