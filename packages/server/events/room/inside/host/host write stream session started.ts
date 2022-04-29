import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'host write stream session started',
    listener: async (io: Server, socket: Socket, clientId: string, fileName: string, fileSize: number, uploadPath: string, hostUploadPath: string, bufferSize: number) => {
        try {
            const actualBufferSize = (1024 * 1024) * 5;
            if (bufferSize != actualBufferSize) bufferSize = actualBufferSize;
            const user = await getUserFromRoom(socket.data.room.id, clientId);
            socket.to(user.socketId).emit('start uploading file to host', fileName, fileSize, uploadPath, hostUploadPath, bufferSize);
        } catch (error) {
            console.log(error);
        }
    }
}