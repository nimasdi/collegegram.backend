import mongoose, { Model, Document, Schema } from "mongoose";

enum contentType {
    TEXT = "text",
    IMAGE = "image",
}

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId,
    receiverId: mongoose.Types.ObjectId,
    content: string,
    seen: Boolean,
    type: contentType
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
    },
    type:{
        type: String,
        enum: Object.values(contentType),
        default: contentType.TEXT
    }
}, {
    timestamps: true, 
});

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', chatSchema);
