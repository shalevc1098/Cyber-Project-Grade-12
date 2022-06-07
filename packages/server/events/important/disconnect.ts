import { Server, Socket } from 'socket.io';
import Room from '../../classes/Room';
import { deleteRoom, getConnectedUsers, getRoom, getUserFromRoom, removeUserFromRoom } from '../../operations/room-operations';

export default {
    name: 'disconnect',
    listener: async (io: Server, socket: Socket, reason: string) => {
        try {
            if (socket.rooms.has('room list')) socket.leave('room list');
            if (socket.data.user) {
                if (socket.data.room) {
                    const userId = socket.data.user.id;
                    const roomId = socket.data.room.id;
                    if (socket.data.room.isHost) {
                        try {
                            await deleteRoom(roomId);
                        } catch (error) { }
                        io.to(roomId).emit('leave room');
                        io.to(`${roomId}-waiting`).emit('leave room');
                        socket.to('room list').emit('update room list');
                    } else {
                        await removeUserFromRoom(roomId, userId);
                        const host = await getUserFromRoom(roomId, socket.data.room.hostId);
                        socket.to(host.socketId).emit('remove client from streams map', userId);
                        if (socket.rooms.has(roomId)) socket.leave(roomId);
                        const connectedUsers = await getConnectedUsers(roomId);
                        const usernames = connectedUsers.map(user => user.username);
                        socket.to(roomId).emit('update connected users', usernames);
                    }
                }
            }
        } catch (error) {
            
        } finally {
            await socket.data.events.unlistenAll();
            await socket.data.events.clear();
        }
    }
}

/*
Error: Room does not exist!
    at C:\Users\Shalev\Desktop\Cyber\packages\server\operations\room-operations.ts:98:30
    at new Promise (<anonymous>)
    at removeUserFromRoom (C:\Users\Shalev\Desktop\Cyber\packages\server\operations\room-operations.ts:94:12)
    at Event.listener (C:\Users\Shalev\Desktop\Cyber\packages\server\events\important\disconnect.ts:25:49)
    at Event.realListener (C:\Users\Shalev\Desktop\Cyber\packages\server\classes\Event.ts:39:14)
    at Socket.emit (node:events:390:28)
    at Socket.emit (node:domain:475:12)
    at Socket.emitReserved (C:\Users\Shalev\Desktop\Cyber\node_modules\socket.io\dist\typed-events.js:56:22)
    at Socket._onclose (C:\Users\Shalev\Desktop\Cyber\node_modules\socket.io\dist\socket.js:358:14)
    at Client.onclose (C:\Users\Shalev\Desktop\Cyber\node_modules\socket.io\dist\client.js:239:20)
*/