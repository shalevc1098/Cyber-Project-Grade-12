import { Server, Socket } from 'socket.io';
import Room from '../../classes/Room';
import { CreateRoomInput } from '../../interfaces/Room';
import { addUserToRoom, createRoom, getRoom, getUserFromRoom, isRoomExist } from '../../operations/room-operations';

// maybe change the listenCategory of the host and the client to another line inside their if

export default {
    name: 'add room',
    listener: async (io: Server, socket: Socket) => {
        try {
            if (!socket.data.user) throw new Error('You are not logged in!');
            if (!socket.data.room) throw new Error('You are not in any room!');
            const { isHost, ...room } = socket.data.room;
            if (isHost) {
                if (await isRoomExist(room.id)) throw new Error('Room is already exist!'); // maybe remove this
                if (socket.data.user.id != socket.data.room.hostId) throw new Error('You cant create a room as someone else!');
                const roomData: CreateRoomInput = {
                    ...room,
                    connectedUsers: []
                }
                await createRoom(roomData);
                await addUserToRoom(room.id, socket.data.user.id, socket.id);
                io.to('room list').emit('update room list');
                socket.to(`${room.id}-waiting`).emit('host ready');
                await socket.data.events.listenCategory('room', 'inside');
                await socket.data.events.listenCategory('room', 'inside', 'host');
                socket.join(room.id);
            } else {
                var host;
                if (await isRoomExist(socket.data.room.id)) {
                    const room: Room = await getRoom(socket.data.room.id);
                    if (room.roomPassword != socket.data.room.roomPassword) throw new Error('Incorrect room password!');
                    const roomId = room.id;
                    await addUserToRoom(roomId, socket.data.user.id, socket.id);
                    await socket.data.events.listenCategory('room', 'inside');
                    await socket.data.events.listenCategory('room', 'inside', 'client');
                    host = await getUserFromRoom(socket.data.room.id, socket.data.room.hostId);
                    socket.to(host.socketId).emit('add client to streams map', socket.data.user.id);
                    socket.to(host.socketId).emit('get storages', socket.data.user.id);
                    socket.join(roomId);
                } else {
                    socket.join(`${socket.data.room.id}-waiting`);
                    delete socket.data.room;
                }
            }
            socket.emit('update connected state to true');
            if (host) socket.to(host.socketId).emit('get storages', socket.data.user.id);
        } catch (error) {
            await socket.data.events.listenCategory('room', 'outside');
            await socket.data.events.listenCategory('room', 'outside', 'create');
            await socket.data.events.listenCategory('room', 'outside', 'list');
            delete socket.data.room;
            socket.emit('incorrect data', 'room', error.message);
            console.log(error);
        }
    }
}

// if the client is not connecting to the room, its maybe because the host of the room is not emitted or emitted before the host
// to fix this, surround this else section inside another if section that checks if the room exist. if yes, run it, and if not, use my idea
// listen to event on each client that will be emitted as soon as the room is created
// on server side, just copy and paste the else section that was cancelled before
// to make it easier and more accurate, just make the client join to the roomId, and wait for the host to emit the ready event
// by that, after the client gets the ready event and emitting the join room event, check if socket.data.room is defined
// if yes, check if the password of the socket.data.room is equal to the actual password of the room
// if not, do what the join event currently does
// in order to prevent adding the client to room while he is already in room, make a map on server side
// the map key will be a string, which is the user id
// the map value will also be a string, which is the room id that the client connected to
// and now, just check if the user id is inside this map, and if yes throw an error with message 'You are already in a room!'
// or make a map but instead of the value being string, it will be class object, which contains all the data about the appropriate logged user
// Example: '12345' => { socketId: 'pop12345' connectedRoom: Room class, userData: User class, ... }
// we set the data when logging or registering
// on server restart, the map should refill accordingly
// there are two places that i can place the event that listens to when the host room is ready to join
// the first place can be in App.tsx, if i dont care about where the loading screen that shows 'Reconnecting to the room' will be
// the second place can be in Room.tsx, that will tell the Files.tsx if it should render the loading screen inside the flatlist, or the files.
// it depends on a prop called 'reconnecting', which is a boolean type
// i think it is already obvious what will be rendered, but i still gonna write it down
// if 'reconnecting' is true, the loading screen will be rendered
// else, the files will be rendered