import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import AuthorQueries from './Author/AuthorQueries.js';
import BooksMutations from './Books/BooksMutations.js';
import BooksQueries from './Books/BooksQueries.js';

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        description: 'Query allows you to get data',
        fields: () => ({
            ...BooksQueries,
            ...AuthorQueries
        })
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        description: 'Mutation allows you to modify data',
        fields: () => ({
            ...BooksMutations
        })
    })
});

export default schema;