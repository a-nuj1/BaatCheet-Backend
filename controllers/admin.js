import User from "../models/user.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";
import {cookieOptions} from "../utils/features.js";
import { adminSecretKey } from "../index.js";



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
    success: true,
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

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, chat, createdAt }) => ({
      _id,
      content,
      attachments: attachments.map((attachment) => attachment.url),
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
      chat: chat._id,
      groupChat: chat.groupChat,
      createdAt,
    })
  );

  return res.status(200).json({
    success: true,
    message: "All messages",
    messages: transformedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [totalUsers, totalChats,groupChat,totalMessages] = await Promise.all([
    User.countDocuments(),
    Chat.countDocuments(),
    Chat.countDocuments({ groupChat: true }),
    Message.countDocuments(),
  ]);


    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last7DaysMessages = await Message.find({
        createdAt: { 
            $gte: last7Days ,
            $lte: today
        },

    }).select('createdAt');

    
    const messages = new Array(7).fill(0);


    // If you want to show the distribution based on weekdays
    // last7DaysMessages.forEach(message => {
    //     const day = new Date(message.createdAt).getDay();
    //     messages[day] = messages[day] + 1;
    // });


    // messages across the last 7 days in chronological order
    const dayInMiliSec = 1000 * 60 * 60 * 24;
    last7DaysMessages.forEach((message) => {
        const approxInd = (today.getTime()-message.createdAt.getTime())/dayInMiliSec;

        const day = Math.floor(approxInd);
        messages[6-day]++;
    });

    const stat = {
      totalUsers,
      totalChats,
      groupChat,
      totalMessages,
      messagesChart: messages,
      
    }

  return res.status(200).json({
    success: true,
    message: "Dashboard stats",
    stats: stat,
  });
});

export { allUsers, allChats, allMessages,getDashboardStats, adminLogin,adminLogout,getAdminData };
