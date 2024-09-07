// notificationConsumer.js
import { notifService } from '../../main';
import { RabbitData } from './rabbit';


export async function processNotificationMessage(message: RabbitData) {
    const { actionCreator, actionType, targetEntityId, targetUser, checkClose } = message;

    // Call notification service functions
    await notifService.createNotification(actionCreator, actionType, targetEntityId, targetUser);
    await notifService.createNotificationForFollowers(actionCreator, actionType, targetEntityId, targetUser, checkClose);
}


