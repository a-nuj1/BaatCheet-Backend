import { faker, simpleFaker } from "@faker-js/faker";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";


const createSingleChats = async(numChats)=>{
    try{
        const users = await User.find().select('_id');

        const chatsPromise = [];

        for(let i = 0; i<users.length; i++){
            for(let j = i+1; j<users.length; j++){
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.word(5),
                        members:[users[i], users[j]]
                    })
                )
            }
        }

        await Promise.all(chatsPromise);

        console.log('chats created successfully');
        process.exit();
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
};

const createGroupChats = async(chatCount)=>{
    try{
        const users = await User.find().select('_id');

        const chatPromise = [];

        for(let i = 0; i<chatCount; i++){
            const numMembers = simpleFaker.number.int({min:3, max: users.length});
            const members = [];

            for(let i = 0; i<numMembers; i++){
                const randomInd = Math.floor(Math.random() * users.length);
                const randomUser = users[randomInd];

                if(!members.includes(randomUser)){
                    members.push(randomUser)
                }
            }

            const chat = Chat.create({
                groupChat: true,
                name: faker.lorem.word(1),
                members,
                creator: members[0],
            })
        }

        await Promise.all(chatPromise);

        console.log('group chats created successfully');
        process.exit();
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
};


const createMessages = async(numMessages)=>{
    try{
        const users = await User.find().select('_id');
        const chats = await Chat.find().select('_id');

        const messagePromise = [];

        for(let i = 0; i<numMessages; i++){
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomChat = chats[Math.floor(Math.random() * chats.length)];

            messagePromise.push(
                Message.create({
                    chat: randomChat,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagePromise);

        console.log('messages created successfully');
        process.exit();
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }

}


const createMessagesInAChat = async(chatId, numMessages)=>{
    try{
        const users = await User.find().select('_id');

        const messagePromise = [];

        for(let i = 0; i<numMessages; i++){
            const randomUser = users[Math.floor(Math.random() * users.length)];

            messagePromise.push(
                Message.create({
                    chat: chatId,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagePromise);

        console.log('messages created successfully');
        process.exit();
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
};

export { createGroupChats, createMessages, createMessagesInAChat, createSingleChats };
