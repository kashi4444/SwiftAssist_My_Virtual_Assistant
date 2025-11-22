import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import genToken from "../config/token.js";

export const signUp = async(req, res)=>{
    try{
        const{name, email, password} = req.body;

        const existEmail = await User.findOne({email});

        if(existEmail){
            return res.status(400).json({message : "Email already exist"});
        }

        if(password.length < 6){
            return res.status(400).json({message : "Password must be of atleast 6 characters"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({name, password : hashedPassword, email});

        const token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly : true,
            maxAge : 7 * 24 * 3600 * 1000,
            sameSite : "strict",
            secure :false
        })

        res.status(202).json(user);
    }catch(err){
        res.status(500).json({message : `sign up error -: ${err}`});
    }
}

export const login = async(req, res)=>{
    try{
        const{email, password} = req.body;

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message : "Email does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({message : "Incorrect Password"});
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly : true,
            maxAge : 7 * 24 * 3600 * 1000,
            sameSite : "strict",
            secure :false
        })

        return res.status(200).json(user);
    }catch(err){
        return res.status(500).jaon({message : `login error -: ${err}`});
    }
}

export const logOut = async(req,res)=>{
    try{
        res.clearCookie("token")
        return res.status(200).json({message : "Logged Out successfully"});
    }catch(err){
        return res.status(500).jaon({message : `Logged out error -: ${err}`});
    }
}