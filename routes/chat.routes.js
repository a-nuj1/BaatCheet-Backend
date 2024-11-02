import express from "express";
import { isAuntentic } from "../middlewares/auth.js";
import { addMembers, getMyChats, getMyGroups, newGroup, removeMembers } from "../controllers/chat.js";

const app = express.Router();

app.use(isAuntentic);

app.post('/new', newGroup)
app.get('/mychats', getMyChats)
app.get('/my/groups', getMyGroups)
app.put('/addmembers', addMembers)
app.put('/removemember', removeMembers);




export default app;