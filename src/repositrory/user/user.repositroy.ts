import { Model } from "mongoose";
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

export class UserRepository {

    private model: Model<IUser>;
  
    constructor(model: Model<IUser>) {
      this.model = model;
    }
    
    async createUser(userData: createUser): Promise<IUser> {
        const user = new this.model(userData);
        await user.save();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }

    async getUserByUsername(username: Username): Promise<IUser> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 0 }).exec();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }

    async getUserPasswordByUsername(username: Username): Promise<loginUser> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 1 , username: 1, email : 1}).exec();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }
    
    async getUserPasswordByEmail(email: Email): Promise<loginUser> {
        const user = await this.model.findOne({email}, { _id: 0 , password : 1 , username: 1, email : 1 }).exec();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }

    async updateUser(username: string, updateData: updateUser): Promise<IUser> {
        const user = await this.model.findOneAndUpdate({username}, updateData).exec();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }

    async UpdatePassword(username:Username, password: Password): Promise<IUser>{
        const user = await this.model.findOneAndUpdate({username}, {password}).exec();

        if(!user) {
            throw new Error('user not created')
        }

        return user
    }

}


