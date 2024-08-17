import mongoose, { Model, Document, Schema } from "mongoose";

export interface IComment extends Document {
    username: string;
    postId: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId;
    text: string;
}

export const commentSchema: Schema<IComment> = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    parentId: {
        type: Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null,
    },
    text: {
        type: String,
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

export const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);
