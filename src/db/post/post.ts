import { Schema } from "mongoose";
import { Username } from "../../types/user.types";

export interface IPost {
    id: string;
    images: Array<string>;
    caption: string;
    tags: Array<string>;
    mentions: Array<Username>;
    createdAt: Date;
    editedAt?: Date;
}

export const postSchema: Schema<IPost> = new Schema({
    id: {
        type: String,
        unique: true
    },
    images: Array<String>,
    caption: String,
    tags: Array<string>,
    mentions: Array<Username>,
    createdAt: {
        type: Date,
        required: true
    },
    editedAt: {
        type: Date,
        required: false
    }
})
