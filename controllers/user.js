import { compare } from "bcrypt";
import User from "../models/user.js";
import { cookieOptions, emitEvent, sendTokens, uploadFilesToCloud } from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import Chat from "../models/chat.js";
import Request from "../models/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMembers } from "../lib/helper.js";

// creating a new user and saving it to the database
const newUser = TryCatch(async (req, res, next) => {
  const { name, username, password, bio } = req.body;

  const file = req.file;

  if(!file) return next(new ErrorHandler("Please Upload Avatar", 400));

  const result = await uploadFilesToCloud([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const user = await User.create({
    name,
    bio,
    username,
    password,
    avatar,
  });

  sendTokens(res, user, 200, "User created successfully");
});

// logging in a user
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));

  const isMatch = await compare(password, user.password);

  if (!isMatch)
    return next(new ErrorHandler("Invalid Username or Password", 404));

  sendTokens(res, user, 200, `Welcome Back, ${user.name}`);
});

const getMyProfile = TryCatch(async (req, res,next) => {
  const user = await User.findById(req.user);

    if(!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    user,
  });
});

const Logout = TryCatch(async (req, res) => {
  return res
    .status(200)
    .cookie("Battcheet-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out Successfully",
    });
});

const SearchUser = TryCatch(async (req, res) => {
  const { name = " " } = req.query;

  // finding all my chats
  const mychats = await Chat.find({
    groupChat: false,
    members: req.user,
  });
  // fetching all users from the my chats
  const allUsersFromChats = mychats.flatMap((chat) => chat.members);

  // finding all users ecxept mea and my friends
  const allUsersExceptMe = await User.find({
    _id: { $nin: allUsersFromChats },
    name: { $regex: name, $options: "i" },
  });

  // modifying the responses
  const users = allUsersExceptMe.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));
  return res.status(200).json({
    success: true,
    users,
  });
});

const sendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });
  if (request) return next(new ErrorHandler("Request already sent", 400));

  await Request.create({
    sender: req.user,
    receiver: userId,
  });

  emitEvent(req, NEW_REQUEST, [userId]);

  return res.status(200).json({
    success: true,
    message: "Friend Request Sent",
  });
});

const acceptRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;
  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user)
    return next(
      new ErrorHandler("You are not authorized to accept this request..!", 401)
    );

  if (!accept) {
    await request.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getNotifications = TryCatch(async (req, res) => {
  const requests = await Request.find({ receiver: req.user })
    .populate("sender", "name avatar")
    .sort("-createdAt");

  const allRequests = requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));

  return res.status(200).json({
    success: true,
    allRequests,
  });
});


const getMyFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId;

    const chats = await Chat.find({
        members: req.user,
        groupChat: false,
    }).populate("members", "name avatar");

    const allFriends = chats.map(({members}) => {
        const otherUsers = getOtherMembers(members, req.user);
        return {
            _id: otherUsers._id,
            name: otherUsers.name,
            avatar: otherUsers.avatar.url,
        }

    });

    if(chatId){
        const chat = await Chat.findById(chatId);
        const availableFriends = allFriends.filter((friend) => {
            return !chat.members.includes(friend._id);
        });

        return res.status(200).json({
            success: true,
            allFriends: availableFriends,
        });

    }
    else{
        return res.status(200).json({
            success: true,
            allFriends,
        });
    }
});


export {
  login,
  newUser,
  getMyProfile,
  Logout,
  SearchUser,
  sendRequest,
  acceptRequest,
  getNotifications,
  getMyFriends
};
