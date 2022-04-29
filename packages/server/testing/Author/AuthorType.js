import { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList } from 'graphql';
import * as AuthorOperations from '../operations/author-operations.js';
import Books from '../Books/BooksType.js';

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'Author object',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        age: { type: GraphQLString },
        books: {
            type: new GraphQLList(Books),
            resolve(parent, args) {
                return AuthorOperations.getBooksByAuthor(parent.id);
            }
        }
    })
});

export default AuthorType;