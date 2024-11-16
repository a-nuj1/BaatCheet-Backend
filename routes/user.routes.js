import express from "express";
import { acceptRequest, getMyFriends, getMyProfile, getNotifications, login, Logout, newUser, SearchUser, sendRequest } from "../controllers/user.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuntentic } from "../middlewares/auth.js";
import { acceptRequestValidator, loginValidator, resiterValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

app.post('/new', singleAvatar, resiterValidator(),validateHandler ,newUser);
app.post('/login',loginValidator(), validateHandler, login);

app.use(isAuntentic);
app.get('/profile', getMyProfile);
app.get('/logout', Logout)
app.get('/search', SearchUser)

app.put('/sendrequest',sendRequestValidator(),validateHandler, sendRequest)

app.put('/acceptrequest',acceptRequestValidator(),validateHandler, acceptRequest)

app.get('/notifications', getNotifications)

app.get('/friends', getMyFriends);


export default app;