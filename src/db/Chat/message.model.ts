import mongoose, { Model, Document, Schema } from "mongoose";

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId,
    receiverId: mongoose.Types.ObjectId,
    content: string,
    seen: Boolean
}

export const chatSchema: Schema<IMessage> = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    seen:{
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, 
});

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', chatSchema);
