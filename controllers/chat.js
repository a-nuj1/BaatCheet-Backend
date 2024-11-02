import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import  Chat from '../models/chat.js'
import User from "../models/user.js"
import { emitEvent } from "../utils/features.js";
import {ALERT, REFETCH_CHATS} from '../constants/events.js'
import { getOtherMembers } from "../lib/helper.js";


const newGroup = TryCatch(async(req, res, next)=>{
    
    const {name, members} = req.body;

    if(members.length < 2) return next(new ErrorHandler('Please add at least two members', 400));

    const allMembers = [...members, req.user];

    await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers,
    })

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({
        success: true,
        message: "Group Created"
    })
    
})  

const getMyChats = TryCatch(async(req, res, next)=>{
    const chats = await Chat.find({members: req.user}).populate('members', 'name avatar');

    const transformedChats = chats.map(({_id, name, members, groupChat})=>{

        const otherMember = getOtherMembers(members, req.user);
        return {
            _id,
            groupChat,
            name: groupChat ? name : otherMember.name,
            members: members.reduce((prev, curr)=>{
                if(curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id)
                }
                return prev
            },[]) ,
            avatar:groupChat 
            ? members.slice(0, 3).map(({avatar})=>avatar.url)
            :[otherMember.avatar.url],

        }
    });

    return res.status(200).json({
        success: true,
        chats: transformedChats
    })
});

const getMyGroups = TryCatch(async(req, res, next)=>{
    const chats = await Chat.find({members: req.user, groupChat: true, creator: req.user,}).populate('members', 'name avatar');

    const transformedChats = chats.map(({_id, name, members, groupChat})=>{

        return {
            _id,
            groupChat,
            name,
            members: members.reduce((prev, curr)=>{
                if(curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id)
                }
                return prev
            },[]) ,
            avatar:members.slice(0, 3).map(({avatar})=>avatar.url),

        }
    });

    return res.status(200).json({
        success: true,
        chats: transformedChats
    })
});

const addMembers = TryCatch(async(req, res, next)=>{
    const {members, chatId} = req.body;
    if(!members || members.length < 1)return next(new ErrorHandler("Please provide members", 400));

    const chat = await Chat.findById(chatId);

    if(!chat) return next(new ErrorHandler('Chat not found', 404));
    if(!chat.groupChat)return next(new ErrorHandler('This is not a group chat', 400));

    if(chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler('You are not authorized to add members', 403));


    const allNewMembersPromise = members.map(i =>User.findById(i, "name"));

    

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers.filter((i)=> !chat.members.includes(i._id.toString())).map((i)=>i._id);

    chat.members.push(...uniqueMembers);

    if(chat.members.length > 100) return next(new ErrorHandler('Group members limit reached', 400));

    await chat.save();
    const allUserName = allNewMembers.map((i) =>i.name).join(",");

    emitEvent(req, ALERT, chat.members, `${allUserName} has been added to ${chat.name} group`);
    emitEvent(req, REFETCH_CHATS, chat.members);
    // emitEvent(req, ALERT, members, `You have been added to ${chat.name} group`);

    return res.status(200).json({
        success: true,
        message: "Members added Successfully"
    })

});

const removeMembers = TryCatch(async(req, res, next)=>{
    const {userId, chatId} = req.body;

    const {chat, userWhoWillBeRemoved} = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name")
    ])

    if(!chat) return next(new ErrorHandler('Chat not found', 404));
    if(!chat.groupChat)return next(new ErrorHandler('This is not a group chat', 400));

    if(chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler('You are not authorized to add members', 403));

    if(chat.members.length <= 3)return next(new ErrorHandler("Group must have at least 3 mebers", 400));


    chat.members = chat.members.fillter((member) =>member.toString() != userId.toString());


    await chat.save();

    emitEvent(req, ALERT, chat.member, `${userWhoWillBeRemoved.name} has been removed from the group`);


    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Members removed Successfully"
    })
})

export {newGroup, getMyChats, getMyGroups, addMembers, removeMembers};