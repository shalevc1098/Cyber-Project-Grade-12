import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";

const RegisterInputType = new GraphQLInputObjectType({
    name: 'RegisterInput',
    description: 'Register input type',
    fields: () => ({
        firstName: { type: GraphQLNonNull(GraphQLString) },
        lastName: { type: GraphQLNonNull(GraphQLString) },
        username: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLNonNull(GraphQLString) },
        phone: { type: GraphQLNonNull(GraphQLString) }
    })
});

export default RegisterInputType;