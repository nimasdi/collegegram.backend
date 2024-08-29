import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';

// Interface for User attributes
export interface IBlock extends Document {
    blockerUsername : Username,
    blockingUsername : Username,
}

// block Schema
const BlockSchema: Schema<IBlock> = new Schema({
    blockerUsername: {
        type: String,
        ref: 'User',
        required: true, 
    },
    blockingUsername: {
        type: String,
        ref: 'User',
        required: true, 
    },
}, {
  timestamps: true,
});

BlockSchema.pre('save', async function (next) {
    const block = this as IBlock;
    // Check if a Block relationship 
    const existingBlock = await mongoose.models.Block.findOne({
        blockerUsername: block.blockerUsername,
        blockingUsername: block.blockingUsername,
    }).catch((err) => {throw new HttpError(500,"server error.")});

    if (existingBlock) {
        // If the relationship already exists, throw an error
        throw new HttpError(400,'This block relationship already exists.');
    }

    // If no such relationship exists, proceed with the save operation
    next();
});

// block Model
export const Block: Model<IBlock> = mongoose.model<IBlock>('Block', BlockSchema);

