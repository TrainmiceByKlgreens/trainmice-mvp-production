import { sendNotification } from '../utils/utils/notificationHelper';
import prisma from '../config/database';

async function testNotifications() {
    console.log('🚀 Starting notification verification script...');

    try {
        // 1. Find a test trainer (or create one if needed, but safer to find existing)
        const trainer = await prisma.user.findFirst({
            where: { role: 'TRAINER' },
            select: { id: true, fullName: true, fcmToken: true }
        });

        if (!trainer) {
            console.error('❌ No trainer found in database to test with.');
            return;
        }

        console.log(`👤 Using trainer: ${trainer.fullName} (${trainer.id})`);
        if (trainer.fcmToken) {
            console.log(`📱 Trainer has FCM token: ${trainer.fcmToken.substring(0, 10)}...`);
        } else {
            console.warn('⚠️ Trainer does not have FCM token. FCM push will be skipped (expected).');
        }

        // 2. Simulate Course Approval Notification
        console.log('\n--- Simulating Course Approval ---');
        await sendNotification({
            userId: trainer.id,
            title: 'TEST: Course Approved',
            message: `Your test course has been approved auto-trigger.`,
            type: 'SUCCESS',
            relatedEntityType: 'course',
            relatedEntityId: 'test-course-id'
        });
        console.log('✅ Course approval notification logic executed.');

        // 3. Simulate Event Creation Notification
        console.log('\n--- Simulating Event Creation ---');
        await sendNotification({
            userId: trainer.id,
            title: 'TEST: New Event Created',
            message: `A new test event has been scheduled for tomorrow.`,
            type: 'INFO',
            relatedEntityType: 'event',
            relatedEntityId: 'test-event-id'
        });
        console.log('✅ Event creation notification logic executed.');

        // 4. Simulate Event Cancellation Notification
        console.log('\n--- Simulating Event Cancellation ---');
        await sendNotification({
            userId: trainer.id,
            title: 'TEST: Event Cancelled',
            message: `The test event has been cancelled.`,
            type: 'ERROR',
            relatedEntityType: 'event',
            relatedEntityId: 'test-event-id'
        });
        console.log('✅ Event cancellation notification logic executed.');

        console.log('\n🎉 Verification script completed successfully!');
        console.log('Please check your database (Notification table) to confirm the records were created.');

    } catch (error: any) {
        console.error('❌ Verification script failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testNotifications();
