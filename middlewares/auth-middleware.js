import jwt from 'jsonwebtoken'
import UserModel from '../models/User.js'


var checkUserAuth = async(req,res,next)=>{
    let token;
    console.log(req.headers)
    console.log("done")
    const {authorization} = req.headers
    if(authorization && authorization.startsWith('Bearer')){
       try {
        // get token from header
        token = authorization.split(' ')[1]
        // console.log("Token-" , token)
        // console.log("Authorization-" , authorization)

        // verify token 
        const {userID}=jwt.verify(token, process.env.JWT_SECRET_KEY)
        // console.log(userID)

        // GET user from token
        req.user = await UserModel.findById(userID).select('-password')
        // console.log(req.user._id)
        
        next()
       } catch (error) {
         console.log(error)
         res.status(401).send({"status":"failed","message":"Unauthorization User"})
       } 
    }
    if(!token){
        res.status(401).send({"status":"failed","message":"Unauthorization User, No Token"})
    }
  
}


export default checkUserAuth