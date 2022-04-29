import User from '../classes/User';

export interface CreateRoomInput {
    id: string;
    roomHost: string;
    roomName: string;
    roomPassword: string;
    roomCreationDate: string;
    roomDescription: string;
    maxUsers: number;
    hostId: string;
    connectedUsers?: User[];
}