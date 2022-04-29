import { GraphQLObjectType, GraphQLString, GraphQLID } from 'graphql';

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'User object',
    fields: () => ({
        /*id: { type: GraphQLID },
        name: { type: GraphQLString },
        age: { type: GraphQLString }*/
        id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        username: { type: GraphQLString },
        password: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString }
    })
});

export default UserType;