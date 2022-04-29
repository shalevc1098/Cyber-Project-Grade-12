import { GraphQLNonNull } from "graphql";
import { addUserToRoom, createRoom, deleteRoom } from "../../operations/room-operations";
import CreateRoomInput from "./CreateRoomInputType";
import DeleteRoomInput from "./DeleteRoomInputType";
import { GraphQLVoid } from 'graphql-scalars';
import JoinRoomInput from "./JoinRoomInputType";

const RoomMutations = {
    createRoom: {
        type: GraphQLVoid,
        args: {
            input: { type: new GraphQLNonNull(CreateRoomInput) }
        },
        resolve: (parent: any, args: any) => {
            const { input } = args;
            return createRoom(input);
        }
    },
    deleteRoom: {
        type: GraphQLVoid,
        args: {
            input: { type: new GraphQLNonNull(DeleteRoomInput) }
        },
        resolve: (parent: any, args: any) => {
            const { input } = args;
            return deleteRoom(input.id);
        }
    },
    joinRoom: {
        type: GraphQLVoid,
        args: {
            input: { type: new GraphQLNonNull(JoinRoomInput) }
        },
        resolve: (parent: any, args: any) => {
            const { input } = args;
            return addUserToRoom(input.id, input.username);
        }
    }
}

export default RoomMutations;