import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './utils/features.js';
import { errorMiddler } from './middlewares/error.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js'
import adminRoutes from './routes/admin.routes.js';


import { Server } from 'socket.io';
import { createServer } from 'http';
import {v2 as cloudinary} from 'cloudinary'


import { CHAT_JOINED, CHAT_LEFT, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from './constants/events.js';
import { v4 as uuid } from 'uuid';
import { getSockets } from './lib/helper.js';
import Message from './models/message.js';
import {corsOptions} from './constants/config.js';
import { socketAuthenticator } from './middlewares/auth.js';


dotenv.config({
  path:'./.env',
});

const app = express();

const PORT = process.env.PORT || 3000;
export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adminhu1234";
const MONGO_URI = process.env.MONGO_URI;

export const userSockeIDs = new Map();
export const onlineUsers = new Set();


connectDB(MONGO_URI);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// createUser(10);
// createSingleChats(10);
// createGroupChats(10);
// createMessagesInAChat("672a19eb04d6da8569fce3f8", 50)

const server = createServer(app);
const io = new Server(server,{
  cors:corsOptions,
})

app.set('io', io);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(cors(corsOptions));


app.use('/api/v1/user', userRoutes);
app.use('/api/v1/chat', chatRoutes)
app.use('/api/v1/admin', adminRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

// socket middleware
io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, 
    async(err)=>
    await socketAuthenticator(err, socket, next)
  );
})


// socket io functionality
io.on('connection', (socket) => {
  // temporary user
  // const user = {
  //   _id: "aammitumakebhalovashi",
  //   name: "Jhethalal",
  // }
  const user = socket.user;
  // console.log('a user connected');

  userSockeIDs.set(user._id.toString(), socket.id);

  // console.log(userSockeIDs);

  socket.on(NEW_MESSAGE, async({chatId, members, message})=>{
    const messaegForRealTime = {
      content: message,
      _id: uuid(),
      sender:{
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    }


    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    }

      // console.log("Emitting", members);

    const userSockets = getSockets(members);
    io.to(userSockets).emit(NEW_MESSAGE, {
      chatId,
      message: messaegForRealTime,
    });

    io.to(userSockets).emit(NEW_MESSAGE_ALERT,{
      chatId,
    })

    // console.log(userSockets);
    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
      
    }
  })

  socket.on(START_TYPING, ({chatId, members})=>{
    // console.log("Typing", members, chatId);

    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, {chatId});
  })

  socket.on(STOP_TYPING, ({chatId, members})=>{
    // console.log("stopTyping", members, chatId);

    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, {chatId});
  })
  
  socket.on(CHAT_JOINED, ({userId, members})=>{
    // console.log("Chat Joined", userId);

    onlineUsers.add(userId.toString());

    const membersSockets = getSockets(members);
    io.to(membersSockets).emit(ONLINE_USERS, Array.from(onlineUsers));

  });
  socket.on(CHAT_LEFT, ({userId, members})=>{
    // console.log("Chat Left", userId);

    onlineUsers.delete(userId.toString());

    const membersSockets = getSockets(members);
    io.to(membersSockets).emit(ONLINE_USERS, Array.from(onlineUsers));

  });

  socket.on('disconnect', () => {
    userSockeIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });

})



// middleware for error handling
app.use(errorMiddler);


server.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`);
})
