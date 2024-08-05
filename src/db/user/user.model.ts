import mongoose, { Schema, Document, Model } from 'mongoose';
import { Email, Name, Password, Username } from '../../types/user.types';

// Interface for User attributes
export interface IUser extends Document {
  firstName: Name;
  lastName: Name;
  username: Username;
  password: Password;
  email: Email;
  followerCount: number;
  followingCount: number;
  postCount: number;
  private: boolean;
  imageUrl: string;
  bio?: string;
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
    unique: true,
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
  followerCount: {
    type: Number,
    required: true,
    default: 0,
  },
  followingCount: {
    type: Number,
    required: true,
    default: 0,
  },
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
    required: true,
  },
  bio: {
    type: String,
  },
}, {
  timestamps: true,
});

// User Model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

