import jwt from 'jsonwebtoken'
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import { adminSecretKey } from '../index.js';

const isAuntentic = (req, res, next)=>{
    // console.log(req.cookies);
    const token = req.cookies['Battcheet-token'];
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


export {isAuntentic,adminOnly}