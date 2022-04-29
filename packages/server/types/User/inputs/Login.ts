import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";

const LoginInputType = new GraphQLInputObjectType({
    name: 'LoginInput',
    description: 'Login input type',
    fields: () => ({
        username: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) }
    })
});

export default LoginInputType;