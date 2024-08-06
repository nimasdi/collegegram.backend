import { Document, Model } from "mongoose";
import { IUser } from "../../db/user/user.model";
import { Email, Name, Password, Username } from "../../types/user.types";
 
export interface createUser {
    username: Username;
    password: Password;
    email: Email;
}

export interface updateUser {
    firstName: Name;
    lastName: Name;
    username: Username;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl: string;
    bio?: string;
}

export interface loginUser{
    username: Username;
    password: Password;
    email: Email;
}


export interface loginUserResponse{
    username: Username;
    password: Password;
    email: Email;
}

export interface dataUserResponse{
    firstName: Name;
    lastName: Name;
    username: Username;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl: string;
    bio?: string;
}




export class UserRepository {

    private model: Model<IUser>;
  
    constructor(model: Model<IUser>) {
      this.model = model;
    }

    private handleDBError = () => {
        throw new Error("خطای شبکه رخ داده است.")
    }
    
    private generateDataUserResponse: (user: IUser) => dataUserResponse = (user) => {
        let userResponse : dataUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: user.password,
            email: user.email,
            private: user.private,
            imageUrl: user.imageUrl,
            bio: user.bio,
        }
        return userResponse
    }
    
    private generateLoginUserResponse: (user: IUser) => loginUserResponse = (user) => {
        let userResponse : loginUserResponse = {
            username: user.username,
            password: user.password,
            email: user.email,
        }
        return userResponse
    }
    
    async createUser(userData: createUser): Promise<Boolean> {
        const user = new this.model(userData);
        await user.save().catch((err) => this.handleDBError());

        return true
    }

    async getUserByUsername(username: Username): Promise<dataUserResponse | null> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 0 })
        .exec().catch((err) => this.handleDBError());

        if(user){
            return this.generateDataUserResponse(user)
        }

        return null
    }

    async getUserPasswordByUsername(username: Username): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 1 , username: 1, email : 1})
        .exec().catch((err) => this.handleDBError());;

        if(user){
            return this.generateLoginUserResponse(user)
        }

        return null
    }
    
    async getUserPasswordByEmail(email: Email): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({email}, { _id: 0 , password : 1 , username: 1, email : 1 })
        .exec().catch((err) => this.handleDBError());;

        if(user){
            return this.generateLoginUserResponse(user)
        }

        return null
    }

    async updateUser(username: string, updateData: updateUser): Promise<dataUserResponse | null> {
        const user = await this.model.findOneAndUpdate({username}, updateData)
        .exec().catch((err) => this.handleDBError());;

        if(user){
            return this.generateDataUserResponse(user)
        }

        return null
    }

    async UpdatePassword(username:Username, password: Password): Promise<loginUserResponse | null>{
        const user = await this.model.findOneAndUpdate({username}, {password})
        .exec().catch((err) => this.handleDBError());;

        if(user){
            return this.generateLoginUserResponse(user)
        }

        return null
    }

}

