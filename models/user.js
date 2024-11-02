import { model, Schema } from "mongoose";
import { hash } from "bcrypt";

const userSchema = new Schema({
    name:{
        type: String,
        required: true,
    },
    username:{
        type: String,
        required: true,
        unique: true,
    },
    bio:{
        type: String,
        required: true,
    },

    password:{
        type: String,
        required: true,
        select: false,
    },

    avatar:{
        public_id:{
            type: String,
            required: true,
        },
        url:{
            type: String,
            required: true,
        }
    }

}, { timestamps: true });

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password = await hash(this.password, 10);

})

const User = model("User", userSchema);
export default User;