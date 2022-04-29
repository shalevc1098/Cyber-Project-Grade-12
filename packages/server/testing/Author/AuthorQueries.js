import { GraphQLID, GraphQLList } from 'graphql';
import { getAuthor, getAuthors } from '../operations/author-operations.js'
import AuthorType from './AuthorType.js';

const AuthorQueries = {
    authors: {
        type: new GraphQLList(AuthorType),
        resolve: () => getAuthors()
    },
    author: {
        type: AuthorType,
        args: {
            id: { type: GraphQLID }
        },
        resolve: async (parent, args, context) => {
            if(context.isLogged()) {
                if (!context.isAuthorIdSameAsId(args.id)) throw new Error('You do not have permission to view other authors other than you.');
            }else {
                context.login(args.id);
            }
            return getAuthor(context.getToken());
        }
    }
}

export default AuthorQueries;