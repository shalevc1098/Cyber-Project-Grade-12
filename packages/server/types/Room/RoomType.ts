import { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLInt } from 'graphql';

const RoomType = new GraphQLObjectType({
    name: 'Room',
    description: 'Room object',
    fields: () => ({
        id: { type: GraphQLID },
        roomHost: { type: GraphQLString },
        roomName: { type: GraphQLString },
        roomPassword: { type: GraphQLString },
        roomCreationDate: { type: GraphQLString },
        roomDescription: { type: GraphQLString },
        maxUsers: { type: GraphQLInt }
    })
});

export default RoomType;