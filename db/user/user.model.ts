import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for User attributes
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  private?: boolean;
  imageUrl?: string;
  bio?: string;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
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
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  postCount: {
    type: Number,
    default: 0,
  },
  private: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
  },
  bio: {
    type: String,
  },
}, {
  timestamps: true,
});

// User Model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
