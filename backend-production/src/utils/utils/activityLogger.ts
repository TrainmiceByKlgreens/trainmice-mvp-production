import prisma from '../../config/database';

export interface CreateActivityLogParams {
  userId?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'APPROVE' | 'REJECT' | 'CONFIRM' | 'CANCEL' | 'LOGIN';
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createActivityLog(params: CreateActivityLogParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break main operations
    console.error('Failed to create activity log:', error);
  }
}

