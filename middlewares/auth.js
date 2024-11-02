import jwt from 'jsonwebtoken'
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";

const isAuntentic = (req, res, next)=>{
    // console.log(req.cookies);
    const token = req.cookies['Battcheet-token'];
    if(!token)return next(new ErrorHandler("Please Login to access this route", 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decodedData);

    req.user = decodedData._id;

    next();
}

export {isAuntentic}