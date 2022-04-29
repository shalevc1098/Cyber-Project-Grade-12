import { GraphQLID, GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";

const JoinRoomInputType = new GraphQLInputObjectType({
    name: 'JoinRoomInputType',
    description: 'Input payload for joining Room',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLID) },
        username: { type: GraphQLNonNull(GraphQLString) }
    })
})

export default JoinRoomInputType;