import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

const UserPayload = new GraphQLObjectType({
    name: 'UserPayload',
    description: 'User type definition',
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLID) },
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) }
    })
});

export default UserPayload;