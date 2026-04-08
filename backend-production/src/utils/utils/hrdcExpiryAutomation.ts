/**
 * HRDC Expiry Automation
 * Checks for expiring HRDC certifications and sends notifications
 */

import prisma from '../../config/database';
import { createActivityLog } from './activityLogger';

export async function checkHRDCExpiry() {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find trainers with HRDC expiring in 30 days
    const expiringTrainers = await prisma.trainer.findMany({
      where: {
        hrdcAccreditationId: { not: null },
        hrdcAccreditationValidUntil: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Find trainers with expired HRDC
    const expiredTrainers = await prisma.trainer.findMany({
      where: {
        hrdcAccreditationId: { not: null },
        hrdcAccreditationValidUntil: {
          lt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Send notifications to trainers
    for (const trainer of expiringTrainers) {
      if (trainer.user?.id && trainer.hrdcAccreditationValidUntil) {
        const daysUntil = Math.ceil(
          (trainer.hrdcAccreditationValidUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        await prisma.notification.create({
          data: {
            userId: trainer.user.id,
            title: 'HRDC Certification Expiring Soon',
            message: `Your HRDC certification (${trainer.hrdcAccreditationId}) expires in ${daysUntil} days. Please renew to continue receiving bookings.`,
            type: 'WARNING',
            relatedEntityType: 'trainer',
            relatedEntityId: trainer.id,
          },
        }).catch(() => {});
      }
    }

    // Send notifications to admins about expiring certifications
    const admins = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (expiringTrainers.length > 0) {
      for (const admin of admins) {
        if (admin.user?.id) {
          await prisma.notification.create({
            data: {
              userId: admin.user.id,
              title: `${expiringTrainers.length} HRDC Certifications Expiring`,
              message: `${expiringTrainers.length} trainer(s) have HRDC certifications expiring within 30 days.`,
              type: 'WARNING',
              relatedEntityType: 'trainer',
              relatedEntityId: null,
            },
          }).catch(() => {});
        }
      }
    }

    // Block expired trainers from new bookings
    for (const trainer of expiredTrainers) {
      // Note: You might want to add a flag to prevent bookings instead of blocking
      // For now, we'll just log it
      await createActivityLog({
        userId: undefined,
        actionType: 'UPDATE',
        entityType: 'trainer',
        entityId: trainer.id,
        description: `HRDC certification expired for ${trainer.fullName}`,
      });
    }

    return {
      expiringCount: expiringTrainers.length,
      expiredCount: expiredTrainers.length,
    };
  } catch (error: any) {
    console.error('HRDC expiry check error:', error);
    throw error;
  }
}

// Run this as a scheduled job (cron)
export async function scheduleHRDCExpiryCheck() {
  // This should be called by a cron job or scheduler
  // Example: Run daily at 9 AM
  return await checkHRDCExpiry();
}

