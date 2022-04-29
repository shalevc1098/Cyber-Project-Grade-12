import { Server, Socket } from 'socket.io';
import { isRegistered, register } from "../../../operations/user-operations";

export default {
    name: 'register',
    listener: async (io: Server, socket: Socket, firstName: string, lastName: string, username: string, password: string, email: string, phone: string) => {
        try {
            if (socket.data.user) throw new Error('You already logged in!');
            const registeredWith: string = await isRegistered(username, email, phone);
            if (registeredWith != 'none') throw new Error(registeredWith);
            // throw new Error(`You cant register with this ${registeredWith} because it is already in use!`);
            const user = await register({ firstName, lastName, username, password, email, phone });
            socket.data.user = user;
            await socket.data.events.unlistenCategory('authorization', 'not logged');

            await socket.data.events.listenCategory('authorization', 'logged');
            await socket.data.events.listenCategory('room');
            await socket.data.events.listenCategory('room', 'outside');
            await socket.data.events.listenCategory('room', 'outside', 'create');
            await socket.data.events.listenCategory('room', 'outside', 'list');
            socket.emit('user data', socket.data.user);
        } catch (error) {
            socket.emit('register error', error.message);
        }
    }
}