import { Server, Socket } from 'socket.io';

export default {
    name: 'download file from host',
    listener: async (io: Server, socket: Socket, fileName: string, filePath: string, savePath: string) => {
        try {
            const bufferSize = (1024 * 1024) * 5;
            socket.emit('start write stream session', fileName, filePath, savePath, bufferSize);
        } catch (error) {
            socket.emit('files error', error.message);
            console.log(error);
        }
    }
}