// notificationConsumer.js
import { notifService } from '../../main';
import { RabbitData } from './rabbit';


export async function processNotificationMessage(message: RabbitData) {
    const { actionCreator, actionType, targetEntityId, targetUser, checkClose } = message;

    // Call notification service functions
    if(actionType === 'followAccepted' || actionType === 'followDeclined'){
        await notifService.changeFollowNotif(actionCreator, targetUser, actionType)
    }else{
        const notifId = await notifService.createNotification(actionCreator, actionType, targetEntityId, targetUser);
        if(notifId){
            await notifService.createNotificationForFollowers(notifId ,actionCreator, targetUser, checkClose);
        }
    }
    
}


