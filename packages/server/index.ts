import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { addUserToCache } from "./operations/user-operations";
import cors from 'cors';
import { connectDatabase } from './database';
import * as dbHelpers from './helpers/db-helpers';
import ws from 'ws';
import User from './classes/User';
import Events from './classes/Events';
import config from '../../config.json'

/*
    when i finish the important stuff:
        1. split each event category to its own file to make to sort them
           example: login, register -> authentication.ts
        2. remove graphql since for me its messy to work with
        3. add the listeners i need and remove the listeners that i don't
        4. add Event class with three parameters, socket client, event name, and event listener
           the class will have two functions, listen (will listen the event) and unlisten (will unlisten the event)
        5. add Events class with one parameter, events path
           the class will have two functions, listenAll (will listen to event category) and unlistenAll (will unlisten to event category)
           the class will have an empty map propery, called events
           on initialize, the class will go through each folder in the events folder,
           import each event, and set it on the events map
        6. switch from local global props file to asyncstorage (if possible)
        7. fix styles:
            1. background size for each dynamic height form
            2. authorization scrollview with register flatlist on the mobile
        8. test the app
        9. load icons on app start
        10. search for any bugs and fix them
*/

// block spam requests in order to prevent crashes

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
    wsEngine: ws.Server,
    maxHttpBufferSize: 1e9,
    pingInterval: 10000,
    pingTimeout: 5000
});

app.use(cors());
app.use(express.urlencoded({ extended: false, limit: '2gb' }));

io.use(async (socket, next) => {
    const events = new Events(io, socket, './events');
    await events.init();
    next();
});

/*io.use(async (socket, next) => {
    console.log(socket.handshake.query);
    next();
});*/

io.on('connection', async (socket) => {
    console.log('New client connected');
    io.allSockets().then(sockets => console.log('Sockets connected:', sockets.size));

    // if needed, use socket.io routes module
    // change "get connected users" to "get room connected users"

    /* find the optimal events to add and remove the client to the host streams map */
});

io.on('error', (error) => {
    console.log(error);
});

connectDatabase().then(async () => {
    const users = await dbHelpers.getAny('Users');
    for (const user of users) {
        const userObject = {
            id: user.ID,
            firstName: user.FirstName,
            lastName: user.LastName,
            username: user.Username,
            password: user.Password,
            email: user.Email,
            phone: user.Phone
        };
        await addUserToCache(new User(userObject.id, userObject.firstName, userObject.lastName, userObject.username, userObject.password, userObject.email, userObject.phone));
    }
    server.listen(config.server.port, config.server.ip, async () => {
        console.log('Server is listening on port 8080!');
    });
});