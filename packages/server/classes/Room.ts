import User from "./User";

class Room {
    public id: string;
    public roomHost: string;
    public roomName: string;
    public roomPassword: string;
    public roomCreationDate: string;
    public roomDescription: string;
    public maxUsers: number;
    public hostId: string;
    public connectedUsers: User[];

    constructor(id: string, roomHost: string, roomName: string, roomPassword: string, roomCreationDate: string, roomDescription: string, maxUsers: number, hostId: string) {
        this.id = id;
        this.roomHost = roomHost;
        this.roomName = roomName;
        this.roomPassword = roomPassword;
        this.roomCreationDate = roomCreationDate;
        this.roomDescription = roomDescription;
        this.maxUsers = maxUsers;
        this.hostId = hostId;
        this.connectedUsers = [];
    }
}

export default Room;