import { GraphQLID, GraphQLList } from 'graphql';
import { getUser, getUsers } from '../../operations/user-operations'
import UserType from './UserType';
import * as dbHelpers from '../../helpers/db-helpers';

const UserQueries = {
    users: {
        type: new GraphQLList(UserType),
        resolve: () => getUsers()
    },
    user: {
        type: UserType,
        args: {
            id: { type: GraphQLID }
        },
        resolve: async (parent: any, args: any, context: any) => {
            if(!context.isLogged() || !context.isUserIdSameAsId(args.id)) throw new Error('You do not have permission to view other users other than you.');
            return getUser(context.getToken());
        }
    },
    me: {
        type: UserType,
        args: {
            id: { type: GraphQLID }
        },
        resolve: (parent: any, args: any, context: any) => {
            return getUser(args.id);
        }
    }
}

export default UserQueries;