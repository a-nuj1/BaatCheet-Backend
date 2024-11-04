import mongoose from "mongoose";
import jwt from "jsonwebtoken";
export const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true,
    httpOnly: true,

}

const connectDB = (uri)=>{
    mongoose.connect(uri, {dbName: 'BaatCheet'})
    .then((data)=>{
        console.log(`Connected to DB: ${data.connection.host}`);
    })
    .catch((err)=>{
        throw err;
    });

}

const sendTokens = (res, user, code, message)=>{
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
    return res.status(code).cookie('Battcheet-token',token,cookieOptions).json({
        success: true,
        message,
    });
}

const emitEvent = (req, event, users, data)=>{
    console.log("Emitting Events", event);
};

const deleteFilesFromCloud = async(public_ids)=>{
    //delete files from cloud
}

export  {connectDB, sendTokens, emitEvent, deleteFilesFromCloud};