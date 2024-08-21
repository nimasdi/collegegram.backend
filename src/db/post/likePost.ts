import mongoose, { Model,Document , Schema, Types } from "mongoose";
import { Username } from "../../types/user.types";

export interface ILikePost extends Document {
    username: Username;
    postId: Types.ObjectId;
}

export const likePostSchema: Schema<ILikePost> = new Schema({
    username: {
        type: String,
        ref: 'User',
        required: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
}, {
    timestamps: true,
});


export const LikePost: Model<ILikePost> = mongoose.model<ILikePost>('LikePost', likePostSchema);
