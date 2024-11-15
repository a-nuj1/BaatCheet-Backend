import express from "express";
import { getMyProfile, login, Logout, newUser, SearchUser } from "../controllers/user.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuntentic } from "../middlewares/auth.js";
import { loginValidator, resiterValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

app.post('/new', singleAvatar, resiterValidator(),validateHandler ,newUser);
app.post('/login',loginValidator(), validateHandler, login);

app.use(isAuntentic);
app.get('/profile', getMyProfile);
app.get('/logout', Logout)
app.get('/search', SearchUser)


export default app;