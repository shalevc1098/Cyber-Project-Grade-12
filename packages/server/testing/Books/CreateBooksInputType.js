import { GraphQLID, GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";

const CreateBooksInputType = new GraphQLInputObjectType({
    name: 'CreateBookInput',
    description: 'Input payload for creating book',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLID) }
    })
})

export default CreateBooksInputType;