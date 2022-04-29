import { Server, Socket } from 'socket.io';
import { login } from "../../../operations/user-operations";

export default {
    name: 'login',
    listener: async (io: Server, socket: Socket, username: string, password: string) => {
        try {
            if (socket.data.user) throw new Error('You already logged in!');
            const user = await login({ username, password }).catch(error => { throw new Error(error) });
            socket.data.user = user;
            await socket.data.events.unlistenCategory('authorization', 'not logged');
            
            await socket.data.events.listenCategory('authorization', 'logged');
            await socket.data.events.listenCategory('room');
            //await socket.data.events.listenAll(socket.data.events.events.get('room').outside);
            await socket.data.events.listenCategory('room', 'outside');
            await socket.data.events.listenCategory('room', 'outside', 'create');
            await socket.data.events.listenCategory('room', 'outside', 'list');
            socket.emit('user data', user);
        } catch (error) {
            socket.emit('login error', error.message);
        }
    }
}