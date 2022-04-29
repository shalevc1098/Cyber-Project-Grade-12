import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import RoomMutations from './Types/Room/RoomMutations';
import RoomQueries from './Types/Room/RoomQueries';
import UserMutations from './Types/User/UserMutations';
import UserQueries from './Types/User/UserQueries';

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        description: 'Query allows you to get data',
        fields: () => ({
            ...RoomQueries,
            ...UserQueries
        })
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        description: 'Mutation allows you to modify data',
        fields: () => ({
            ...RoomMutations,
            ...UserMutations
        })
    })
});

export default schema;