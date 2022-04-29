import { GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import UserType from "../User/UserType";

const CreateRoomInputType = new GraphQLInputObjectType({
    name: 'CreateRoomInput',
    description: 'Input payload for creating Room',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLID) },
        roomHost: { type: GraphQLNonNull(GraphQLString) },
        roomName: { type: GraphQLNonNull(GraphQLString) },
        roomPassword: { type: GraphQLNonNull(GraphQLString) },
        roomCreationDate: { type: GraphQLNonNull(GraphQLString) },
        roomDescription: { type: GraphQLNonNull(GraphQLString) },
        maxUsers: { type: GraphQLNonNull(GraphQLInt) }
    })
})

export default CreateRoomInputType;