import { Schema, model } from "mongoose";

const messageSchema = new Schema({
    sender:{
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    chat:{
        type: Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    content:{
        type: String,
    },

    attachments:[
        {
            public_id:{
                type: String,
                required: true,
            },
            url:{
                type: String,
                required: true,
            }
        }
    ],
}, { timestamps: true });

const Message = model("Message", messageSchema);
export default Message;