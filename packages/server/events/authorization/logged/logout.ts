import { Server, Socket } from 'socket.io';

export default {
    name: 'logout',
    listener: async (io: Server, socket: Socket) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            delete socket.data.user;
            delete socket.data.room;
            if (socket.rooms.has('room list')) socket.leave('room list');
            await socket.data.events.unlistenCategory('authorization', 'logged');
            await socket.data.events.unlistenCategory('room');
            await socket.data.events.unlistenCategory('room', 'outside');
            await socket.data.events.unlistenCategory('room', 'outside', 'create');
            await socket.data.events.unlistenCategory('room', 'outside', 'list');
            
            await socket.data.events.listenCategory('authorization', 'not logged');
            socket.emit('reload app');
        } catch (error) {
            console.log(error);
        }
    }
}