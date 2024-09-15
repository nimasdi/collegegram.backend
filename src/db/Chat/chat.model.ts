import mongoose, { Model, Document, Schema } from "mongoose";

export interface IChat extends Document {
    username_1: mongoose.Types.ObjectId;
    username_2: mongoose.Types.ObjectId;
}

export const chatSchema: Schema<IChat> = new Schema({
    username_1: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username_2: {
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
    },
}, {
    timestamps: true, 
});

export const Chat: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);
