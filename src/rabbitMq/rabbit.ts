// rabbitmq.js
import amqplib from 'amqplib';
import { Username } from '../types/user.types';
import { Types } from 'mongoose';

const RABBITMQ_URL = process.env.RABBITMQ_URL || ''; 

export type ActionType = 'like' | 'comment' | 'followRequest' | 'followAccepted' | 'followDeclined' | 'mention'


export interface RabbitData{
    actionCreator: Username,
    actionType: ActionType,
    targetEntityId: Types.ObjectId, 
    targetUser: string, 
    checkClose: Boolean
}


async function createChannel() {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    return channel;
}

async function publishToQueue(queueName: string, data: RabbitData) {
    const channel = await createChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
}

async function consumeFromQueue(queueName: string, callback: (msg: any) => void) {
    const channel = await createChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.consume(queueName, (msg) => {
        if (msg !== null) {
            callback(JSON.parse(msg.content.toString()));
            channel.ack(msg);
        }
    });
}

export { publishToQueue, consumeFromQueue };
