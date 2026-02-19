import prisma from '../../config/database';
import { admin } from '../../config/firebaseAdmin';

export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    relatedEntityType?: string;
    relatedEntityId?: string;
}

/**
 * Sends both a database notification and an FCM push notification (if token exists)
 */
export async function sendNotification(payload: NotificationPayload) {
    try {
        const { userId, title, message, type, relatedEntityType, relatedEntityId } = payload;

        // 1. Create database notification
        const dbNotification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                relatedEntityType,
                relatedEntityId,
            },
        });

        // 2. Fetch user's FCM token
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true },
        });

        // 3. Send FCM push notification if token exists
        if (user?.fcmToken) {
            try {
                await admin.messaging().send({
                    token: user.fcmToken,
                    data: {
                        notificationId: dbNotification.id,
                        type: type,
                        title: title,
                        body: message,
                        relatedEntityType: relatedEntityType || '',
                        relatedEntityId: relatedEntityId || '',
                    },
                    notification: {
                        title: title,
                        body: message,
                    },
                });
                console.log(`✅ FCM notification sent to user ${userId}`);
            } catch (fcmError: any) {
                console.error(`❌ Failed to send FCM notification to user ${userId}:`, fcmError.message);
                // We don't throw here to avoid failing the operation if FCM fails
            }
        } else {
            console.warn(`⚠️ User ${userId} does not have an FCM token registered. Skip FCM push.`);
        }

        return dbNotification;
    } catch (error: any) {
        console.error('❌ Send notification error:', error);
        throw error;
    }
}
