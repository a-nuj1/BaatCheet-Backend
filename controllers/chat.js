import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import { deleteFilesFromCloud, emitEvent } from "../utils/features.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events.js";
import { getOtherMembers } from "../lib/helper.js";

const newGroup = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;

  // if (members.length < 2)
  //   return next(new ErrorHandler("Please add at least two members", 400));

  const allMembers = [...members, req.user];

  await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);

  return res.status(201).json({
    success: true,
    message: "Group Created",
  });
});

const getMyChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "name avatar"
  );

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMembers(members, req.user);
    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMember.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
    };
  });

  return res.status(200).json({
    success: true,
    chats: transformedChats,
  });
});

const getMyGroups = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({
    members: req.user,
    groupChat: true,
    creator: req.user,
  }).populate("members", "name avatar");

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    return {
      _id,
      groupChat,
      name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
      avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
    };
  });

  return res.status(200).json({
    success: true,
    chats: transformedChats,
  });
});

const addMembers = TryCatch(async (req, res, next) => {
  const { members, chatId } = req.body;
  // if (!members || members.length < 1)
  //   return next(new ErrorHandler("Please provide members", 400));

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));
  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are not authorized to add members", 403));

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100)
    return next(new ErrorHandler("Group members limit reached", 400));

  await chat.save();
  const allUserName = allNewMembers.map((i) => i.name).join(",");

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUserName} has been added to ${chat.name} group`
  );
  emitEvent(req, REFETCH_CHATS, chat.members);
  // emitEvent(req, ALERT, members, `You have been added to ${chat.name} group`);

  return res.status(200).json({
    success: true,
    message: "Members added Successfully",
  });
});

const removeMembers = TryCatch(async (req, res, next) => {
  const { userId, chatId } = req.body;

  const [chat, userWhoWillBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not Found..", 404));
  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not authorized to remove members", 403)
    );

  if (chat.members.length <= 3)
    return next(new ErrorHandler("Group must have at least 3 mebers", 400));

  chat.members = chat.members.filter(
    (member) => member.toString() != userId.toString()
  );

  await chat.save();

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${userWhoWillBeRemoved.name} has been removed from the group`
  );

  emitEvent(req, REFETCH_CHATS, chat.members);

  return res.status(200).json({
    success: true,
    message: "Member removed Successfully",
  });
});

const leaveGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found..", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat...", 400));

  const remainingMem = chat.members.filter(
    (member) => member.toString() !== req.user.toString()
  );

  if (remainingMem.length < 3) {
    return next(new ErrorHandler("Group must have at least 3 members", 400));
  }

  if (chat.creator.toString() === req.user.toString()) {
    // const newAdmin = remainingMem[0]; // new admin will be the first member in the group

    // if want to choose admin randomly
    const randomIndex = Math.floor(Math.random() * remainingMem.length);
    const newAdmin = remainingMem[randomIndex];

    chat.creator = newAdmin;
  }

  chat.members = remainingMem;
  const [user] = await Promise.all([
    User.findById(req.user, "name"),
    chat.save(),
  ]);

  // await chat.save();

  emitEvent(req, ALERT, chat.members, `User ${user.name} has left the group`);

  return res.status(200).json({
    success: true,
    message: "You have left the group",
  });
});

const sendAttachments = TryCatch(async (req, res, next)=> {
  const { chatId } = req.body;

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found..", 404));

  const files = req.files || [];

  if (files.length < 1)
    return next(new ErrorHandler("Please provide attachments", 400));

  const attachemnts = [];

  const messageForDB = {
    content: "",
    attachemnts,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    // content: "",
    // attachemnts,
    // sender:{
    //     _id: me._id,
    //     name: me.name
    //     // if want to show avatar in frontend you can take avatar also
    // },
    // chat: chatId,

    ...messageForDB,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };

  const mess = await Message.create(messageForDB);

  emitEvent(req, NEW_ATTACHMENT, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
    chatId,
  });

  return res.status(200).json({
    success: true,
    mess,
  });
});

const getChatDetails = TryCatch(async (req, res, next) => {
  if (req.query.populate === "true") {
    const chat = await Chat.findById(req.params.id)
      .populate("members", "name avatar")
      .lean();
    if (!chat) return next(new ErrorHandler("Chat not found..", 404));

    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res.status(200).json({
      success: true,
        chat,
    });
  }

  else{
    const chat = await Chat.findById(req.params.id)
    if (!chat) return next(new ErrorHandler("Chat not found..", 404));
    return res.status(200).json({
      success: true,
        chat,
    });
  }
});


const renameGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const {name} = req.body;

    const chat = await Chat.findById(chatId);

    if(!chat)return next(new ErrorHandler("Chat not Found..., 404"));

    if(!chat.groupChat)return next(new ErrorHandler("This is not a group chat", 400));

    if (chat.creator.toString() !== req.user.toString())
        return next(
          new ErrorHandler("You are not authorized to rename Group", 403)
        );

    chat.name = name;
    await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);
    
    return res.status(200).json({
        success: true,
        message: "Group name updated successfully"
    });

});

const deleteChat = TryCatch(async(req, res, next)=>{
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if(!chat)return next(new ErrorHandler("Chat not Found...", 404));

    const members = chat.members;

    if(chat.groupChat && chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler('You are not allowed to delete the groupchat', 403));

    if(!chat.groupChat && !chat.members.includes(req.user.toString())){
        return next(
            new ErrorHandler('You are not allowed to delete the chat', 403)
        );
    }

    // deleting attachments and files from cloudinary

    const messWithAttachments = await Message.find({
        chat:chatId,
        attachments: {
            $exists: true,
            $ne: []
        },
    })

    const public_ids = [];

    messWithAttachments.forEach(({attachments})=>{
        attachments.forEach(({public_id})=>{
            public_ids.push(public_id)
        })
    })

    await Promise.all([
        //deleting files from cloudinary
        deleteFilesFromCloud(public_ids),
        chat.deleteOne(),
        Message.deleteMany({chat: chatId})
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: 'Chat deleted Successfully',
    })
})

const getMessages = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { page = 1} = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [messages, totalMessagesCount] = await Promise.all([
        Message.find({chat: chatId})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name')
        .lean(),
        Message.countDocuments({chat: chatId})
    ])

    const totalPages = Math.ceil(totalMessagesCount/limit);
  
    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      totalPages,
    });
})



export {
  newGroup,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages
};
