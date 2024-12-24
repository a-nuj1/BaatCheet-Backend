import User from "../models/user.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";
import {cookieOptions} from "../utils/features.js";
import { adminSecretKey } from "../index.js";
import { tr } from "@faker-js/faker";



//admin login
const adminLogin = TryCatch(async (req, res,next) => {
  const { secretKey } = req.body;
  const isMatch = secretKey === adminSecretKey;

  if(!isMatch){
    return next(new ErrorHandler("Invalid Admin key", 401));
  }
  
  const token = jwt.sign(secretKey, process.env.JWT_SECRET)


  return res.status(200).cookie("BaatCheet-admin-token",token,{
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  }).json({
    success: true,
    message: "Authenticated Successfully, Welcome BOSS!",
    // token,
  });
})

// admin logout
const adminLogout = TryCatch(async (req, res) => {
  return res.status(200)
  .clearCookie("BaatCheet-admin-token")
  .json({
    success: true,
    message: "Logged out successfully",
  });
});

// get admin data
const getAdminData = TryCatch(async (req, res) => {
  return res.status(200).json({
    admin:true,
    message: "Admin verified successfully",
  });
});



// adimn controller
const allUsers = TryCatch(async (req, res) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [grpCnt, frdCnt] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        grpCnt,
        frdCnt,
      };
    })
  );

  return res.status(200).json({
    success: true,
    message: "All users",
    users: transformedUsers,
  });
});

const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformedChat = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          // _id: creator?._id || "",
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res.status(200).json({
    success: true,
    message: "All chats",
    chats: transformedChat,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

    // console.log(messages);

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat._id,
      groupChat: chat.groupChat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    })
  );

  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliseconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
  };
  // console.log(stats);
  return res.status(200).json({
    success: true,
    stats,
  });
});

export { allUsers, allChats, allMessages,getDashboardStats, adminLogin,adminLogout,getAdminData };
