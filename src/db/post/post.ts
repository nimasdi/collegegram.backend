import mongoose, { Model,Document , Schema, Types } from "mongoose";
import { Username } from "../../types/user.types";
import { v4 as uuidv4 } from 'uuid';
export interface IPost extends Document {
    images: string[];
    caption: string;
    tags: string[];
    mentions: Username[];
    userId: mongoose.Types.ObjectId;
}


export const postSchema: Schema<IPost> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    caption: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        required: true,
    },
    mentions: {
        type: [String],
        required: true,
    },
}, {
    timestamps: true,
});


export const Post: Model<IPost> = mongoose.model<IPost>('Post', postSchema);
