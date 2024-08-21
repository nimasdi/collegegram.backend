import mongoose, { Model,Document , Schema, Types } from "mongoose";
import { Username } from "../../types/user.types";

export interface ISavePost extends Document {
    username: Username;
    postId: Types.ObjectId;
}

export const savePostSchema: Schema<ISavePost> = new Schema({
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


export const SavePost: Model<ISavePost> = mongoose.model<ISavePost>('SavePost', savePostSchema);
