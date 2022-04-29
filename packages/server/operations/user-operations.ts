import users from '../db/users';
import * as dbHelpers from '../helpers/db-helpers'
import generateID from '../generateID';
import { Login, Register } from '../interfaces/User';
import User from '../classes/User';

export const getUsers = () => users.values();

export const getUser = (id) => {
    return new Promise<User>((resolve, reject) => {
        const user = users.get(id) as User;
        if (!user) return reject(`User with id of ${id} does not exist!`);
        resolve(user);
    });
}

export const isRegistered = (username, email, phone) => {
    return new Promise<string>((resolve, reject) => {
        users.forEach(user => {
            if (user.username == username) resolve('username');
            if (user.email == email) resolve('email');
            if (user.phone == phone) resolve('phone');
        });
        resolve('none');
    });
}

export const register = (input: Register) => {
    return new Promise<User>(async (resolve, reject) => {
        try {
            const user = new User(generateID().toString(), input.firstName, input.lastName, input.username, input.password, input.email, input.phone);
            const parsedUser = JSON.parse(JSON.stringify(user));
            await dbHelpers.insert('Users', [...Object.values(parsedUser)]);
            users.set(user.id, user);
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
}

export const login = (input: Login) => { // change the parameters to use the Login interface
    return new Promise<User>(async (resolve, reject) => {
        const userId: string = await getUserIdByUsername(input.username);
        if (userId == '0') return reject('username');
        const user = await getUser(userId);
        if(input.password != user.password) return reject('password');
        resolve(user);
    });
}

export const getUserIdByUsername = (username: string) => {
    return new Promise<string>((resolve, reject) => {
        users.forEach(user => {
            if (user.username == username) resolve(user.id);
        });
        resolve('0');
    });
}

export const addUserToCache = (user: User) => {
    return new Promise<User>((resolve, reject) => {
        users.set(user.id, user);
        const userId = user.id;
        const userResolver = users.get(userId) as User;
        resolve(userResolver);
    });
}