import { Router } from "express";
import { UserService } from "../services/user/user.service";
import { UserRepository, createUser } from "../repositrory/user/user.repositroy";
import { User } from "../db/user/user.model";

const userRoutes = Router()

const userRepo = new UserRepository(User)
const userServive = new UserService(userRepo)

userRoutes.post("/create",async (req,res,next) => {
    try {
        const user: createUser = createUserDto.parse(req)
        const userCreated = await userServive.createUser(user)
        if(userCreated){
            res.status(200).json({"message" : "ثبت نام با موفقیت انجام شد."})
        }
    } catch (error) {
        
    }
})