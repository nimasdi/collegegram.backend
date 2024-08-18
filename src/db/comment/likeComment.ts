import mongoose, { Model, Document, Schema, Types } from "mongoose";
import { Username } from "../../types/user.types";

export interface ILikeComment extends Document {
    username: Username;
    postId: Types.ObjectId;
    commentId: Types.ObjectId;
}

export const likeCommentSchema: Schema<ILikeComment> = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: true,
    },
    username: {
        type: String,
        ref: 'User',
        required: true, 
    },
}, {
    timestamps: true,
});

export const LikeComment: Model<ILikeComment> = mongoose.model<ILikeComment>('LikeComment', likeCommentSchema);
