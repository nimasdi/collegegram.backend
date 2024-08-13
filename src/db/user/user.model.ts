import mongoose, { Schema, Document, Model } from 'mongoose';
import { Email, Name, Password, Username } from '../../types/user.types';
import { IPost, postSchema } from '../post/post';

// Interface for User attributes
export interface IUser extends Document {
  firstName: Name;
  lastName: Name;
  username: Username;
  password: Password;
  email: Email;
  followers: Array<Username>;
  followings: Array<Username>;
  postCount: number;
  private: boolean;
  imageUrl: string;
  bio?: string;
  posts: IPost[];
}



// User Schema
const UserSchema: Schema<IUser> = new Schema({
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 8,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 8,
    maxlength: 50,
  },
  followers: Array<Username>,
  followings: Array<Username>,
  postCount: {
    type: Number,
    required: true,
    default: 0,
  },
  private: {
    type: Boolean,
    required: true,
    default: false,
  },
  imageUrl: {
    type: String,
    defualt: ""
  },
  bio: {
    type: String,
  },
  posts: {
    type: [postSchema],
    default: []
  },
}, {
  timestamps: true,
});

// User Model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

