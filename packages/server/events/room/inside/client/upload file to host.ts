import { Server, Socket } from 'socket.io';
import { getUserFromRoom } from '../../../../operations/room-operations';

export default {
    name: 'upload file to host',
    listener: async (io: Server, socket: Socket, fileName: string, fileSize: number, uploadPath: string, hostUploadPath: string) => {
        try {
            const host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
            const bufferSize = (1024 * 1024) * 5;
            hostUploadPath = `${hostUploadPath}/${socket.data.user.id}-${fileName}`;
            socket.to(host.socketId).emit('start host write stream session', socket.data.user.id, fileName, fileSize, uploadPath, hostUploadPath, bufferSize);
        } catch (error) {
            console.log(error);
        }
    }
}