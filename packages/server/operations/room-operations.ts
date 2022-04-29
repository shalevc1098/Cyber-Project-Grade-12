import Room from '../classes/Room';
import User from '../classes/User';
import rooms from '../db/rooms';
import users from '../db/users';
import { CreateRoomInput } from '../interfaces/Room';

export const getRooms = () => {
    return new Promise<Map<string, Room>>((resolve, reject) => {
        resolve(rooms);
    });
};

export const getRoom = (roomId) => {
    return new Promise<Room>((resolve, reject) => {
        try {
            const room = rooms.get(roomId);
            if (!room) throw new Error(`Room with id of ${roomId} not found!`)
            resolve(room);
        } catch (error) {
            reject(error);
        }
    });
}

export const createRoom = (roomData: CreateRoomInput) => {
    return new Promise<Room>(async (resolve, reject) => {
        const roomId = roomData.id;
        if (await isRoomExist(roomId)) return reject(new Error('Room is already exist!'));
        rooms.set(roomId, new Room(roomData.id, roomData.roomHost, roomData.roomName, roomData.roomPassword, roomData.roomCreationDate, roomData.roomDescription, roomData.maxUsers, roomData.hostId));
        const room = rooms.get(roomId) as Room;
        resolve(room);
    });
}

export const deleteRoom = (roomId) => {
    return new Promise<boolean>(async (resolve, reject) => {
        try {
            if (!(await isRoomExist(roomId))) throw new Error('Room does not exist!');
            rooms.delete(roomId);
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

export const isRoomExist = (roomId) => {
    return new Promise<boolean>((resolve, reject) => {
        resolve(rooms.has(roomId));
    });
}

export const getConnectedUsers = (roomId) => {
    return new Promise<Array<User>>((resolve, reject) => {
        const room = rooms.get(roomId);
        if (!room) return reject(new Error('Room does not exist!'));
        resolve(room.connectedUsers);
    });
}

export const addUserToRoom = (roomId, userId, socketId) => {
    return new Promise<boolean>((resolve, reject) => {
        try {
            const room = rooms.get(roomId);
            const user = users.get(userId);
            if (!room) return reject(new Error('Room does not exist!'));
            if (!user) return reject(new Error('User does not exist!'));
            if (room && user) {
                const isAlreadyAdded = room.connectedUsers.find(user => user.id == userId);
                if (!isAlreadyAdded) room.connectedUsers.push({ ...user, socketId });
                resolve(true);
            }
        } catch (error) {
            reject(error);
        }
    });
}

export const getUserFromRoom = (roomId, userId) => {
    return new Promise<User>((resolve, reject) => {
        try {
            const room = rooms.get(roomId);
            if (!room) return reject(new Error('Room does not exist!'));
            const user = room.connectedUsers.find(user => user.id == userId);
            if (!user) return reject(new Error('User does not exist!'));
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
}

export const removeUserFromRoom = (roomId, userId) => {
    return new Promise<boolean>((resolve, reject) => {
        try {
            const room = rooms.get(roomId);
            const user = users.get(userId);
            if (!room) throw new Error('Room does not exist!');
            if (!user) throw new Error('User does not exist!');
            if (room && user) {
                const userFromRoom = room.connectedUsers.find(user => user.id == userId);
                if (userFromRoom) {
                    const index = room.connectedUsers.indexOf(userFromRoom);
                    if (index > -1) room.connectedUsers.splice(index, 1);
                }
                resolve(true);
            }
        } catch (error) {
            reject(error);
        }
    });
}