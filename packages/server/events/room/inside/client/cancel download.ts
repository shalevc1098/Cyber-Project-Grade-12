import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'cancel download',
    listener: async (io: Server, socket: Socket, savePath: string, shouldEmitBack: boolean) => {
        try {
            if (!socket.data.room) return;
            /*
                i did on purpose that when the client leaves a room, he will send to the host to cancel all the unfinished downloads and uploads from him
                when the host just reconnects it will work just fine
                but when the host deletes the room, the clients will disconnect from it, and after that this event will be emitted
                it depeneds on the amount of unfinished downloads and uploads that each client have
                i didn't checked the state of why the client leaving the room
                (is it because the host deleted it?, the client left it?, it was a server error?, or even something else?)
                maybe i will do the check in the future, but this is optionally
                so it will go like this: delete room -> disconnect everyone from the room -> cancel all the unfinished downloads and uploads
            */
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            socket.to(host.socketId).emit('cancel download', socket.data.user.id, savePath, shouldEmitBack);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}