import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

// Add note to a course (Trainer)
router.post(
    '/',
    authenticate,
    authorize('TRAINER'),
    [
        body('courseId').notEmpty().isString(),
        body('note').notEmpty().isString().trim(),
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { courseId, note } = req.body;
            const trainerId = req.user!.id;

            // Check if course exists
            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            // Create note
            const courseNote = await prisma.courseNote.create({
                data: {
                    courseId,
                    trainerId,
                    note,
                },
                include: {
                    trainer: {
                        select: {
                            fullName: true,
                            profilePic: true,
                        },
                    },
                },
            });

            await createActivityLog({
                userId: trainerId,
                actionType: 'CREATE',
                entityType: 'course_note',
                entityId: courseNote.id,
                description: `Trainer added a note to course: ${course.title}`,
            });

            return res.status(201).json({ courseNote });
        } catch (error: any) {
            console.error('Create course note error:', error);
            return res.status(500).json({ error: 'Failed to add note', details: error.message });
        }
    }
);

// Get notes for a course (Admin or Trainer)
router.get(
    '/course/:courseId',
    authenticate,
    authorize('TRAINER', 'ADMIN'),
    async (req: AuthRequest, res: Response) => {
        try {
            const { courseId } = req.params;

            const notes = await prisma.courseNote.findMany({
                where: { courseId },
                include: {
                    trainer: {
                        select: {
                            fullName: true,
                            profilePic: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Auto-mark TO_TRAINER admin notes as read when trainer fetches notes
            if (req.user!.role === 'TRAINER') {
                await prisma.adminCourseNote.updateMany({
                    where: {
                        courseId,
                        type: 'TO_TRAINER',
                        isRead: false
                    },
                    data: { isRead: true }
                });
            }

            return res.json({ notes });
        } catch (error: any) {
            console.error('Get course notes error:', error);
            return res.status(500).json({ error: 'Failed to fetch notes', details: error.message });
        }
    }
);

export default router;
