import { Server, Socket } from 'socket.io';
import { getUser } from '../../operations/user-operations';

export default {
    name: 'set data',
    listener: async (io: Server, socket: Socket, key: string, data: any) => {
        try {
            if (key == 'user') {
                data = JSON.parse(data);
                if (typeof (data) != 'object') throw new Error('Invalid user!');
                const user = await getUser(data.id);
                Object.keys(user).forEach(key => {
                    if (user[key] != data[key]) throw new Error('One or more items in the user object is different!');
                });
                socket.data.user = user;
                await socket.data.events.unlistenCategory('authorization', 'not logged');

                await socket.data.events.listenCategory('authorization', 'logged');
                await socket.data.events.listenCategory('room');
                await socket.data.events.listenCategory('room', 'outside');
                await socket.data.events.listenCategory('room', 'outside', 'create');
                await socket.data.events.listenCategory('room', 'outside', 'list');
                socket.emit('check if client was in room before reload');
            }
            else if (key == 'room') {
                if (data.isHost) if (socket.data.user.id != data.hostId) throw new Error('You cant set room data as someone else!');
                socket.data.room = data;
                await socket.data.events.unlistenCategory('room', 'outside');
                await socket.data.events.unlistenCategory('room', 'outside', 'create');
                await socket.data.events.unlistenCategory('room', 'outside', 'list');
                socket.emit('ask the client to emit add room event');
            }
        } catch (error) {
            socket.emit('incorrect data', key, error.message);
            console.log(error);
        }
    }
}