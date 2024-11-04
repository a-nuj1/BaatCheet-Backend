import express from "express";
import { isAuntentic } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMyChats, getMyGroups, leaveGroup, newGroup, removeMembers, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachemntsMultur } from "../middlewares/multer.js";

const app = express.Router();

app.use(isAuntentic);

app.post('/new', newGroup)
app.get('/mychats', getMyChats)
app.get('/my/groups', getMyGroups)
app.put('/addmembers', addMembers)
app.put('/removemember', removeMembers);
app.delete('/leave/:id', leaveGroup)

// send attachemnts
app.post('/message',attachemntsMultur, sendAttachments);

app.route('/:id').get(getChatDetails).put(renameGroup).delete(deleteChat);


export default app;