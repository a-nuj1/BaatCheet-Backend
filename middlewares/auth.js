import jwt from 'jsonwebtoken'
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import { adminSecretKey } from '../index.js';
import { BAATCHEET_TOKEN } from '../constants/config.js';
import User from '../models/user.js';

const isAuntentic = (req, res, next)=>{
    // console.log(req.cookies);
    const token = req.cookies[BAATCHEET_TOKEN];
    if(!token)return next(new ErrorHandler("Please Login to access this route", 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decodedData);

    req.user = decodedData._id;

    next();
}

const adminOnly = (req, res, next)=>{
    const token = req.cookies['BaatCheet-admin-token'];
    if(!token)return next(new ErrorHandler("Only Admin can access this route", 401));

    const secretKey = jwt.verify(token, process.env.JWT_SECRET);

    const isMatch = secretKey === adminSecretKey;

    if(!isMatch){
        return next(new ErrorHandler("Invalid Admin key", 401));
    }

    next();
}

const socketAuthenticator = async(err, socket, next)=>{
    try {
        if(err) return next(err);

        const authToken = socket.request.cookies[BAATCHEET_TOKEN];

        if(!authToken) return next(new ErrorHandler("Please Login to access this route", 401));

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
        
        const user = await User.findById(decodedData._id)
        if(!user) return next(new ErrorHandler("User not found", 404));

        socket.user = user;

        return next();

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Please Login to access this route", 401));
    }
}


export {isAuntentic,adminOnly,socketAuthenticator}