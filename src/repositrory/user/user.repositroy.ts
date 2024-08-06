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

type MongoDoc<T> = (Document<unknown, {}, T> & T & Required<{
    _id: unknown;
}>);

const handleDBError = () => {
    throw new Error("خطای شبکه رخ داده است.")
}
 
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
    
    async createUser(userData: createUser): Promise<Boolean> {
        const user = new this.model(userData);
        await user.save().catch((err) => handleDBError());

        return true
    }

    async getUserByUsername(username: Username): Promise<MongoDoc<IUser> | null> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 0 })
        .exec().catch((err) => handleDBError());

        return user
    }

    async getUserPasswordByUsername(username: Username): Promise<MongoDoc<IUser> | null> {
        const user = await this.model.findOne({username}, { _id: 0 , password : 1 , username: 1, email : 1})
        .exec().catch((err) => handleDBError());;

        return user
    }
    
    async getUserPasswordByEmail(email: Email): Promise<MongoDoc<IUser> | null> {
        const user = await this.model.findOne({email}, { _id: 0 , password : 1 , username: 1, email : 1 })
        .exec().catch((err) => handleDBError());;

        return user
    }

    async updateUser(username: string, updateData: updateUser): Promise<MongoDoc<IUser> | null> {
        const user = await this.model.findOneAndUpdate({username}, updateData)
        .exec().catch((err) => handleDBError());;

        return user
    }

    async UpdatePassword(username:Username, password: Password): Promise<MongoDoc<IUser> | null>{
        const user = await this.model.findOneAndUpdate({username}, {password})
        .exec().catch((err) => handleDBError());;

        return user
    }

}


