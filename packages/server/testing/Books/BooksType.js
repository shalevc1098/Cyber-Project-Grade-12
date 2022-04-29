import { GraphQLObjectType, GraphQLString, GraphQLID } from 'graphql';

const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'Book object',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        genre: { type: GraphQLString },
        authorId: { type: GraphQLID }
    })
});

export default BookType;