import { GraphQLNonNull } from "graphql";
import { register, getUserIdByUsername, getUser } from "../../operations/user-operations";
import RegisterInput from './inputs/Register';
import LoginInput from "./inputs/Login";
import { GraphQLVoid } from 'graphql-scalars';

const UserMutations = {
    register: {
        type: GraphQLVoid,
        args: {
            input: { type: new GraphQLNonNull(RegisterInput) }
        },
        resolve: async (parent, args) => {
            const { input } = args;
            const userId: string = await getUserIdByUsername(input.username);
            if (userId != '0') throw new Error(`User with username of ${input.username} already exist!`);
            return await register(input);
        }
    },
    login: {
        type: GraphQLVoid,
        args: {
            input: { type: new GraphQLNonNull(LoginInput) }
        },
        resolve: async (parent, args, context) => {
            const { input } = args;
            const userId: string = await getUserIdByUsername(input.username);
            if (userId == '0') throw new Error(`User with username of ${input.username} not exist.`);
            const user = await getUser(userId);
            if(input.password != user.password) throw new Error(`Password is incorrect!`);
        }
    }
}

export default UserMutations;