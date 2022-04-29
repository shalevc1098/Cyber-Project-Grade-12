import { GraphQLID, GraphQLList, GraphQLString } from 'graphql';
import { getRoom, getRooms } from '../../operations/room-operations'
import RoomType from './RoomType';

const RoomQueries = {
    room: {
        type: RoomType,
        args: {
            id: { type: GraphQLID }
        },
        resolve: (parent: any, args: any) => {
            return getRoom(args.id);
        }
    },
    rooms: {
        type: new GraphQLList(RoomType),
        resolve: () => getRooms()
    }
}

export default RoomQueries;