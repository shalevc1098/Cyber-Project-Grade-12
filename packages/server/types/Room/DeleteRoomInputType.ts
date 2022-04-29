import { GraphQLID, GraphQLInputObjectType, GraphQLNonNull } from "graphql";

const DeleteRoomInputType = new GraphQLInputObjectType({
    name: 'DeleteRoomInput',
    description: 'Input payload for deleting Room',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLID) }
    })
})

export default DeleteRoomInputType;