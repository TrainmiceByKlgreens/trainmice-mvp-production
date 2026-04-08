import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all trainer documents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, verified, documentType } = req.query;

    const where: any = {};
    if (trainerId) {
      where.trainerId = trainerId;
    }
    if (verified !== undefined) {
      where.verified = verified === 'true';
    }
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await prisma.trainerDocument.findMany({
      where,
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        verifiedByAdmin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ documents });
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
});

// Get single document
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.trainerDocument.findUnique({
      where: { id: req.params.id },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        verifiedByAdmin: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ document });
  } catch (error: any) {
    console.error('Get document error:', error);
    return res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

// Verify document
router.put(
  '/:id/verify',
  [
    body('verified').isBoolean(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { verified, notes } = req.body;

      const document = await prisma.trainerDocument.update({
        where: { id: req.params.id },
        data: {
          verified,
          verifiedBy: verified ? req.user!.id : null,
          verifiedAt: verified ? new Date() : null,
          notes: notes || null,
        },
        include: {
          trainer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: verified ? 'APPROVE' : 'REJECT',
        entityType: 'trainer_document',
        entityId: document.id,
        description: `${verified ? 'Verified' : 'Unverified'} document: ${document.documentType} for ${document.trainer.fullName}`,
      });

      return res.json({ document });
    } catch (error: any) {
      console.error('Verify document error:', error);
      return res.status(500).json({ error: 'Failed to verify document', details: error.message });
    }
  }
);

// Delete document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.trainerDocument.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        documentType: true,
        trainer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.trainerDocument.delete({
      where: { id: req.params.id },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'trainer_document',
      entityId: req.params.id,
      description: `Deleted document: ${document.documentType} for ${document.trainer.fullName}`,
    });

    return res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
});

export default router;

