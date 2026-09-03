import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const authMiddleware = (req : Request , res : Response , next : NextFunction ) =>{
try {
const authHeader = req.headers.authorization;

if(!authHeader){
    return res.status(401).json({
        success : false,
        message : "Authentication Required",
        data : null
    })
}


if(!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
        success : false ,
        message : "Invalid authorization format",
        data : null
    })
}

const token = authHeader.split(" ")[1];

const decoded = jwt.verify(token , config.jwt_secret) as {
    id : string ,
    role : string 
}


req.user  = {
    id : decoded.id,
    role : decoded.role
}


next()

}catch(error){
return res.status(401).json({
    success : false ,
    message :"Invalid or expired token",
    data : null
})
}
}
