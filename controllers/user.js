import { compare } from 'bcrypt';
import User from '../models/user.js';
import { cookieOptions, sendTokens } from '../utils/features.js';
import { TryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';

// creating a new user and saving it to the database 
const newUser = async(req, res) => {

    const {name, username, password, bio} = req.body;

    const avatar = {
        public_id: 'abcde',
        url: 'bcdfdis'
    };

    const user = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    })


    sendTokens(res, user, 200, 'User created successfully');
};


// logging in a user
const login = TryCatch(async(req, res, next) => {

    const {username, password} = req.body;
    
    const user = await User.findOne({username}).select('+password');
    if(!user) return next (new ErrorHandler ("Invalid Username or Password", 404))
    

    const isMatch = await compare(password, user.password);

    if(!isMatch) return next (new ErrorHandler ("Invalid Username or Password", 404))



  sendTokens(res, user, 200, 'User logged in successfully');
});


const getMyProfile = TryCatch(async(req, res)=>{

    const user = await User.findById(req.user)

    res.status(200).json({
        success: true,
        user
    })
})

const Logout = TryCatch(async(req, res)=>{
    return res.status(200).cookie('Battcheet-token', "", {...cookieOptions,maxAge:0}).json({
        success:true,
        message: "Logged out Successfully"
    })
})


const SearchUser = TryCatch(async(req, res)=>{
    const {name} = req.query;

    return res.status(200).json({
        success: true,
        message: name,
    })
})


export {login, newUser, getMyProfile, Logout, SearchUser};