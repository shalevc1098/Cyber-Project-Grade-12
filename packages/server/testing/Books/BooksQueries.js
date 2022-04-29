import { GraphQLID, GraphQLList } from 'graphql';
import { getBook, getBooks } from '../operations/books-operations.js'
import BooksType from '../Books/BooksType.js';

const BooksQueries = {
    books: {
        type: new GraphQLList(BooksType),
        resolve: () => getBooks()
    },
    book: {
        type: BooksType,
        args: {
            id: { type: GraphQLID }
        },
        resolve: (parent, args) => {
            return getBook(args.id);
        }
    }
}

export default BooksQueries;