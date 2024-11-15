import express from "express";
import { isAuntentic } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroup, removeMembers, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachemntsMultur } from "../middlewares/multer.js";
import { addMembersValidator, chatIdValidator, newGroupValidator, removeMembersValidator, renameValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

app.use(isAuntentic);

app.post('/new', newGroupValidator(), validateHandler, newGroup)
app.get('/mychats', getMyChats)
app.get('/my/groups', getMyGroups)
app.put('/addmembers',addMembersValidator(), validateHandler, addMembers)
app.put('/removemember',removeMembersValidator(),validateHandler, removeMembers);

app.delete('/leave/:id',chatIdValidator(), validateHandler, leaveGroup)

// send attachemnts
app.post('/message',attachemntsMultur,sendAttachmentsValidator(),validateHandler, sendAttachments);

app.get('/message/:id',chatIdValidator(),validateHandler, getMessages);


// get chat details
app.route('/:id')
.get(chatIdValidator(),validateHandler,getChatDetails)
.put(renameValidator(),validateHandler,renameGroup)
.delete(chatIdValidator(),validateHandler,deleteChat);


export default app;