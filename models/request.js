import { Schema, Types, model } from "mongoose";

const requestSchema = new Schema({
    status:{
        type: String,
        default: 'pending',
        enum:['pending', 'accepted', 'rejected'],
    },
    sender:{
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver:{
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    }
},{ timestamps: true });

const Request = model("Request", requestSchema);
export default Request;