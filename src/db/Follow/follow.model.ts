import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';

// Interface for User attributes
export interface IFollow extends Document {
    followingUsername: Username,
    followerUsername: Username,
    status: 'pending' | 'accepted' | 'declined',
    closeFriend: Boolean
}

// Follow Schema
const FollowSchema: Schema<IFollow> = new Schema({
    followingUsername: {
        type: String,
        ref: 'User',
        required: true,
        unique: false
    },
    followerUsername: {
        type: String,
        ref: 'User',
        required: true,
        unique: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
    },
    closeFriend: {
        type : Boolean
    }
}, {
    timestamps: true,
});

FollowSchema.pre('save', async function (next) {
    const follow = this as IFollow;
    // Check if a follow relationship with the same follower and following user names already exists
    const existingFollow = await mongoose.models.Follow.findOne({
        followerUserName: follow.followerUsername,
        followingUserName: follow.followingUsername,
    }).catch((err) => { throw new HttpError(500, "server error.") });

    if (existingFollow) {
        // If the relationship already exists, throw an error
        throw new HttpError(400, 'This follow relationship already exists.');
    }

    // If no such relationship exists, proceed with the save operation
    next();
});

// Follow Model
export const Follow: Model<IFollow> = mongoose.model<IFollow>('Follow', FollowSchema);

