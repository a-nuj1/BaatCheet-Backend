import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {v4 as uuid} from "uuid";
import {v2 as cloudinary} from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";


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
        user,
        message,
    });
}

const emitEvent = (req, event, users, data)=>{
    let io = req.app.get('io');
    const userSocket = getSockets(users);
    io.to(userSocket).emit(event, data);
    // console.log("Emitting Events", event);
};

 //upload files to cloudinary
const uploadFilesToCloud = async(files=[])=>{
    const uploadPromises = files.map((file)=>{
        return new Promise((resolve, reject)=>{
            cloudinary.uploader.upload(getBase64(file),
                {
                    resource_type: "auto",
                    public_id: uuid(),
                },
                (err, result)=>{
                    if(err) return reject(err);
                    return resolve(result);
                }
            )
        })
    })

    try {
        const results = await Promise.all(uploadPromises);
        const formatedResults = results.map((result)=>{
            return {
                public_id: result.public_id,
                url: result.secure_url,
            }
        });
        return formatedResults;
    } catch (error) {
        throw new Error("Error uploading files to cloudinary", error);
    }

}

const deleteFilesFromCloud = async(public_ids)=>{
    //delete files from cloud
}

export  {connectDB, sendTokens, emitEvent, deleteFilesFromCloud, uploadFilesToCloud};