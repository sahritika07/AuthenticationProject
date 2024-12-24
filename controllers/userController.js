import UserModel from "../models/User.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from "../config/emailConfig.js"


class UserController{
    static userRegistration=async(req,res) =>{
        const {name,email,password,password_confirmation,tc} = req.body
        const user = await UserModel.findOne({email:email})
        if(user){
            res.send({"status":"failed","message":"Email already exists"})
        }else{
            if(name && email && password && password_confirmation && tc ){
                if(password === password_confirmation){
                    try{
                        const salt = await bcrypt.genSalt(10)
                        const hashPassword = await bcrypt.hash(password,salt)
                        const doc = new UserModel({
                        name: name,
                        email:email,
                        password:hashPassword,
                        tc:tc

                     })
                     await doc.save()
                     const saved_user = await  UserModel.findOne({email:email})

                     // Generating JWT token
                     const token = jwt.sign({userID:saved_user._id}, process.env.JWT_SECRET_KEY,{expiresIn: '5d'})

                     res.status(201).send({"status":"success","message":"Registration Successful", "token":token}) 
                    }catch(error){
                        console.log(error)
                        res.send({"status":"failed","message":"Unable to Register"}) 
                    }
                }else{
                    res.send({"status":"failed","message":"Password and ConfirmPassword does not match"}) 
                }
            }else{
                res.send({"status":"failed","message":"All fields are required"})
            }
        }
    }

    static userLogin= async(req,res)=>{
        try {
           const {email,password} = req.body
           if(email && password){
            const user = await UserModel.findOne({email:email})
            if(user!=null){
                 const isMatch = await bcrypt.compare(password,user.password)
                 if((user.email === email) && isMatch){
                    const token = jwt.sign({userID:user._id}, process.env.JWT_SECRET_KEY,{expiresIn: '5d'})
                    res.send({"status":"success","message":"Login Success","token":token})
                 }else{
                    res.send({"status":"failed","message":"Email or Password is not Valid"})
                 }
            }else{
                res.send({"status":"failed","message":"You are not a registered user"})
            }
           }else{
            res.send({"status":"failed","message":"All fields are required"})
           }
        } catch (error) {
            console.log(error)
            res.send({"status":"failed","message":"Unable to Login"})
        }
    }

    static changeUserPassword = async(req,res)=>{
        const {password, password_confirmation}=req.body;
        if(password && password_confirmation){
            if(password !== password_confirmation){
                res.send({"status":"failed","message":"New Password and confirm New Password does not match"})
            }else{
                const salt = await bcrypt.genSalt(10)
                const newHashPassword = await bcrypt.hash(password,salt)
                // console.log(req.user._id)
                await UserModel.findByIdAndUpdate(req.user._id, {$set: {password: newHashPassword}})
                res.send({"status":"success","message":"Password Changed Successfully"})
            }
        }else{
            res.send({"status":"failed","message":"All fields are required"})
        }
    }

    static loggedUser = async(req,res)=>{
        res.send({"user":req.user})
    }

    static sendUserPassResetEmail = async(req,res)=>{
        const {email}= req.body
        if(email){
            const user = await UserModel.findOne({email:email})
            
            if(user){
                const secret = user._id+process.env.JWT_SECRET_KEY
                const token = jwt.sign({userID: user._id},secret,{expiresIn: '15m'})
                const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`
                console.log(link)
                // Send email

                let info = await transporter.sendMail({
                   from: process.env.EMAIL_FROM,
                   to : user.email,
                   subject:"PROJECT - Password Reset Link",
                   html:`<a href=${link}>Click Here</a> to Reset Your Password`

                })
                res.send({"status":"success","message":"Password Reset Email Sent... Please Check Your Email" , "info": info }) 
            }else{
                res.send({"status":"failed","message":"Email doesn't exists"}) 
            }
        }else{
            res.send({"status":"failed","message":"Email is required"}) 
        }
    }

    static userPasswordReset = async(req,res)=>{
        const {password,password_confirmation}= req.body
        const {id,token} = req.params
        const user = await UserModel.findById(id)
        
        const new_secret = user._id + process.env.JWT_SECRET_KEY
        try {
            jwt.verify(token, new_secret)
            if(password && password_confirmation){
                if(password !== password_confirmation){
                    res.send({"status":"failed","message":"New Password and Confirm password doesn't match"})
                }else{
                    const salt = await bcrypt.genSalt(10)
                    const newHashPassword = await bcrypt.hash(password,salt)
                    await UserModel.findByIdAndUpdate(user._id, {$set: {password: newHashPassword}})
                    res.send({"status":"success","message":"Password Reset Successfully"})
                }

            }else{
                res.send({"status":"failed","message":"All fields are required"})
            }
        } catch (error) {
            console.log(error)
            res.send({"status":"failed","message":"InValid Token"})
        }
        


    }
}


export default UserController