import mongoose, { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { Username } from "../../types/user.types";
import { IMessage } from "../../db/Chat/message.model";

type contentType = 'text' | 'image'


interface messageReponse{
    id:mongoose.Types.ObjectId,
    sender:Object,
    content:string,
    type:'text' | 'image',
    seen:Boolean,
    createdAt:Date
}

interface chatResponse {
    sender: {
      _id: mongoose.Types.ObjectId;
      username: Username,
      firstName: string;
      lastName: string;
    };
    lastMessage: IMessage | null;
    unseenCount: number;
  }


export class MessageRepository {

    private model: Model<IMessage>;

    constructor(model: Model<IMessage>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async addNewMessage(senderId: mongoose.Types.ObjectId, receiverId: mongoose.Types.ObjectId, content: string, type: contentType  ): Promise<void> {
        const message = new this.model({senderId, receiverId, content, type})
        await message.save().catch((err) => this.handleDBError(err))
    }

    async seenMessages(messageIds: mongoose.Types.ObjectId[], receiverId: mongoose.Types.ObjectId ): Promise<void>{
        this.model.updateMany({ _id: {$in : messageIds} , receiverId}, {seen: true})
        .catch((err) => this.handleDBError(err))
    }

    async getMessages(receiverId: mongoose.Types.ObjectId,  pageNumber: number, pageSize: number) : Promise<messageReponse[]>{
        const skip = (pageNumber - 1) * pageSize

        const messages = await this.model.aggregate([
            {
                $match: {
                    receiverId: receiverId,
                },
            },
            {
                $lookup:{
                    from: 'users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender',
                }
            },
            {
                $project: {
                   _id:1,
                   sender:1,
                   content:1,
                   type:1,
                   seen:1,
                   createdAt:1
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
        ])

        const messageReponse: messageReponse[] = []
        for(const message of messages){
            messageReponse.push({
                id:message.id,
                sender:message.sender,
                content:message.content,
                type:message.type,
                seen:message.seen,
                createdAt:message.createdAt
            })
        }

        return messageReponse
    }

    async getChatLists(receiverId: mongoose.Types.ObjectId) : Promise<chatResponse[]>{
        
        const ChatLists = await this.model.aggregate([
            // Step 1: Match messages for the receiver
            { $match: { receiverId: receiverId } },
            
            // Step 2: Sort by createdAt to get the latest message for each sender
            { $sort: { createdAt: -1 } },
      
            // Step 3: Group by senderId to get the last message and count unseen messages
            {
              $group: {
                _id: "$senderId",
                lastMessage: { $first: "$$ROOT" }, // Get the first document after sorting
                unseenCount: {
                  $sum: { $cond: [{ $eq: ["$seen", false] }, 1, 0] } // Count unseen messages
                }
              }
            },
            {
                $lookup: {
                  from: 'users', // The User collection name in MongoDB
                  localField: '_id', // The senderId field in the Message schema
                  foreignField: '_id', // The _id field in the User collection
                  as: 'sender'
                }
            },
            { $unwind: '$sender' },
            // Step 4: Project the desired output fields
            {
              $project: {
                sender: {
                    _id: 1,
                    username: 1, 
                    firstName: 1,  
                    lastName:1  
                },
                lastMessage: 1,
                unseenCount: 1
              }
            }
        ]).exec();

        return ChatLists
    }



}

