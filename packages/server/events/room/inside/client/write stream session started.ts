import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'write stream session started',
    listener: async (io: Server, socket: Socket, fileName: string, filePath: string, savePath: string, bufferSize: number) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            const actualBufferSize = (1024 * 1024) * 5;
            if (bufferSize != actualBufferSize) bufferSize = actualBufferSize;
            socket.to(host.socketId).emit('start sending file to client', socket.data.user.id, fileName, filePath, savePath, bufferSize);
        } catch (error) {
            console.log(error);
        }
    }
}