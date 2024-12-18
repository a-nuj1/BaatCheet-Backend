import { userSockeIDs } from "../index.js";


export const getOtherMembers = (members, userId) =>{
    return members.find((member)=>member._id.toString() !== userId.toString());
}


export const getSockets = (users=[])=> {
    const sockets = users.map((user)=>userSockeIDs.get(user.toString()));
    return sockets;
}

export const getBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  };