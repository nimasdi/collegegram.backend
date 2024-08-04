import { Model } from "mongoose";
import { IUser } from "../../../db/user/user.model";

export interface createUser {
    username: string;
    password: string;
    email: string;
}

export interface updateUser {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    private: boolean;
    imageUrl: string;
    bio?: string;
}

// interface loginField { username: string, password: string } | { email: string , password: string}

// export interface loginUser {
    
   
// }???

export class UserRepository {

    private model: Model<IUser>;
  
    constructor(model: Model<IUser>) {
      this.model = model;
    }
    
    async createUser(userData: createUser): Promise<IUser> {
        const user = new this.model(userData);
        return await user.save();
    }

    async getUserByUsername(username: string): Promise<IUser | null> {
        return await this.model.findOne({username}).exec();
    }

    async updateUser(username: string, updateData: updateUser): Promise<IUser | null> {
        return await this.model.findOneAndUpdate({username}, updateData).exec();
    }

}


