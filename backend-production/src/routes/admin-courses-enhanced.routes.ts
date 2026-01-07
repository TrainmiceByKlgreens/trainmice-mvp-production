import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Approve trainer-submitted course
router.put('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status === 'APPROVED') {
      return res.status(400).json({ error: 'Course is already approved' });
    }

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });

    // Notify trainer
    if (course.trainerId) {
      await prisma.notification.create({
        data: {
          userId: course.trainerId,
          title: 'Course Approved',
          message: `Your course "${course.title}" has been approved and is now active.`,
          type: 'SUCCESS',
          relatedEntityType: 'course',
          relatedEntityId: course.id,
        },
      }).catch(() => {});
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'APPROVE',
      entityType: 'course',
      entityId: course.id,
      description: `Approved course: ${course.title}`,
    });

    return res.json({ course: updated, message: 'Course approved successfully' });
  } catch (error: any) {
    console.error('Approve course error:', error);
    return res.status(500).json({ error: 'Failed to approve course', details: error.message });
  }
});

// Reject trainer-submitted course
router.put(
  '/:id/reject',
  [body('rejectionReason').optional().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const updated = await prisma.course.update({
        where: { id: req.params.id },
        data: { status: 'DENIED' },
      });

      // Notify trainer
      if (course.trainerId) {
        await prisma.notification.create({
          data: {
            userId: course.trainerId,
            title: 'Course Rejected',
            message: `Your course "${course.title}" has been rejected.${req.body.rejectionReason ? ` Reason: ${req.body.rejectionReason}` : ''}`,
            type: 'WARNING',
            relatedEntityType: 'course',
            relatedEntityId: course.id,
          },
        }).catch(() => {});
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'REJECT',
        entityType: 'course',
        entityId: course.id,
        description: `Rejected course: ${course.title}`,
        metadata: { rejectionReason: req.body.rejectionReason || null },
      });

      return res.json({ course: updated, message: 'Course rejected successfully' });
    } catch (error: any) {
      console.error('Reject course error:', error);
      return res.status(500).json({ error: 'Failed to reject course', details: error.message });
    }
  }
);

// Upload course material
router.post(
  '/:id/materials',
  [
    body('fileUrl').notEmpty().trim(),
    body('fileName').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const material = await prisma.courseMaterial.create({
        data: {
          courseId: req.params.id,
          fileUrl: req.body.fileUrl,
          fileName: req.body.fileName,
        },
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CREATE',
        entityType: 'course_material',
        entityId: material.id,
        description: `Uploaded material for course: ${course.title}`,
      });

      return res.status(201).json({ material });
    } catch (error: any) {
      console.error('Upload course material error:', error);
      return res.status(500).json({ error: 'Failed to upload course material', details: error.message });
    }
  }
);

// Delete course material
router.delete('/:id/materials/:materialId', async (req: AuthRequest, res: Response) => {
  try {
    const material = await prisma.courseMaterial.findUnique({
      where: { id: req.params.materialId },
    });

    if (!material || material.courseId !== req.params.id) {
      return res.status(404).json({ error: 'Course material not found' });
    }

    await prisma.courseMaterial.delete({
      where: { id: req.params.materialId },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'course_material',
      entityId: req.params.materialId,
      description: 'Deleted course material',
    });

    return res.json({ message: 'Course material deleted successfully' });
  } catch (error: any) {
    console.error('Delete course material error:', error);
    return res.status(500).json({ error: 'Failed to delete course material', details: error.message });
  }
});

// Get course reviews
router.get('/:id/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await prisma.courseReview.findMany({
      where: { courseId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews });
  } catch (error: any) {
    console.error('Get course reviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch course reviews', details: error.message });
  }
});

// Delete course review (spam removal)
router.delete('/:id/reviews/:reviewId', async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.courseReview.findUnique({
      where: { id: req.params.reviewId },
    });

    if (!review || review.courseId !== req.params.id) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.courseReview.delete({
      where: { id: req.params.reviewId },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'course_review',
      entityId: req.params.reviewId,
      description: 'Deleted course review (spam removal)',
    });

    return res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return res.status(500).json({ error: 'Failed to delete review', details: error.message });
  }
});

// Get course schedule
router.get('/:id/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const schedule = await prisma.courseSchedule.findMany({
      where: { courseId: req.params.id },
      orderBy: [
        { dayNumber: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.json({ schedule });
  } catch (error: any) {
    console.error('Get course schedule error:', error);
    return res.status(500).json({ error: 'Failed to fetch course schedule', details: error.message });
  }
});

// Update course schedule
router.put(
  '/:id/schedule',
  [body('schedule').isArray()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Delete existing schedule
      await prisma.courseSchedule.deleteMany({
        where: { courseId: req.params.id },
      });

      // Create new schedule
      const scheduleItems = req.body.schedule.map((item: any) => {
        // Ensure moduleTitle is an array
        const moduleTitleArray = Array.isArray(item.moduleTitle) 
          ? item.moduleTitle 
          : (item.moduleTitle ? [item.moduleTitle] : []);
        
        // Ensure submoduleTitle is an array or null
        let submoduleTitleArray: string[] | null = null;
        if (item.submoduleTitle) {
          if (Array.isArray(item.submoduleTitle)) {
            submoduleTitleArray = item.submoduleTitle;
          } else {
            submoduleTitleArray = [item.submoduleTitle];
          }
        }

        return {
          courseId: req.params.id,
          dayNumber: item.dayNumber,
          startTime: item.startTime,
          endTime: item.endTime,
          moduleTitle: moduleTitleArray,
          submoduleTitle: submoduleTitleArray,
          durationMinutes: item.durationMinutes || 120,
        };
      });

      const schedule = await prisma.courseSchedule.createMany({
        data: scheduleItems,
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'course',
        entityId: req.params.id,
        description: `Updated schedule for course: ${course.title}`,
      });

      return res.json({ schedule, count: schedule.count });
    } catch (error: any) {
      console.error('Update course schedule error:', error);
      return res.status(500).json({ error: 'Failed to update course schedule', details: error.message });
    }
  }
);

export default router;

