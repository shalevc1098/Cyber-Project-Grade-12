import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host file chunk',
    listener: async (io: Server, socket: Socket, clientId: string, chunk: string, savePath: string) => {
        try {
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('host file chunk', chunk, savePath);
        } catch (error) {
            console.log(error);
        }
    }
}

/*
    try to manually read the file from the host:
        1. the host read the file chunk
        2. the host sends the file chunk to the client
        3. the host waits for the client to get the file chunk
        4. after the client told the host that he got the file chunk, the host will know that he can now send the next file chunk to the client
    repeat the steps above until all of the file chunks are fully sent
    i dont know if this will fix the problem of the lags when the dev console is open, but it is worth a try
    for now the host dont care if the client fully got the chunk, he only sending each chunk every 250ms (0.25 seconds)
    for every 1 second, the host send 4 chunks, which is 40MB (10MB each)
*/