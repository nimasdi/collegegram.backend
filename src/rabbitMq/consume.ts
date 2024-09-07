// notificationConsumer.js
import { notifService } from '../../main';
import { RabbitData } from './rabbit';


export async function processNotificationMessage(message: RabbitData) {
    const { actionCreator, actionType, targetEntityId, targetUser, checkClose } = message;

    // Call notification service functions
    const notifId = await notifService.createNotification(actionCreator, actionType, targetEntityId, targetUser);
    if(notifId){
        await notifService.createNotificationForFollowers(notifId ,actionCreator, targetUser, checkClose);
    }
}


