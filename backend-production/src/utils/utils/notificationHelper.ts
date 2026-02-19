import prisma from '../../config/database';
import { admin } from '../../config/firebaseAdmin';

export interface NotificationPayload {
    userId: string | string[];
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    relatedEntityType?: string;
    relatedEntityId?: string;
}

/**
 * Sends both database notification(s) and FCM push notification(s)
 */
export async function sendNotification(payload: NotificationPayload) {
    try {
        const { userId, title, message, type, relatedEntityType, relatedEntityId } = payload;
        const userIds = Array.isArray(userId) ? userId : [userId];

        const results = [];

        for (const id of userIds) {
            // 1. Create database notification
            const dbNotification = await prisma.notification.create({
                data: {
                    userId: id,
                    title,
                    message,
                    type,
                    relatedEntityType,
                    relatedEntityId,
                },
            });

            // 2. Fetch user's FCM token
            const user = await prisma.user.findUnique({
                where: { id: id },
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
                    console.log(`✅ FCM notification sent to user ${id}`);
                } catch (fcmError: any) {
                    console.error(`❌ Failed to send FCM notification to user ${id}:`, fcmError.message);
                    // We don't throw here to avoid failing the operation if FCM fails
                }
            } else {
                console.warn(`⚠️ User ${id} does not have an FCM token registered. Skip FCM push.`);
            }

            results.push(dbNotification);
        }

        return results.length === 1 ? results[0] : results;
    } catch (error: any) {
        console.error('❌ Send notification error:', error);
        throw error;
    }
}
