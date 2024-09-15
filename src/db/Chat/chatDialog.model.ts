import mongoose, { Model, Document, Schema } from "mongoose";

export interface IChat extends Document {
    senderId: mongoose.Types.ObjectId;
    content: string,
    chatId: mongoose.Types.ObjectId
}

export const chatSchema: Schema<IChat> = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    chatId: {
        type: Schema.Types.ObjectId, 
        ref: 'Chat', 
        required: true,
    },
}, {
    timestamps: true, 
});

export const Chat: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);
