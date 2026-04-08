import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest, authenticateOptional } from '../middleware/auth';
import { generateCourseCode } from '../utils/utils/sequentialId';
import { calculateCourseRating, calculateCourseRatings } from '../utils/utils/ratingCalculator';
import { uploadMaterial } from '../middleware/upload';
import { createActivityLog } from '../utils/utils/activityLogger';
import path from 'path';
import fs from 'fs';
import { broadcastUpdate } from '../lib/socket';

const router = express.Router();

const shouldRedactTrainerImages = (req: AuthRequest) => !req.user || req.user.role === 'CLIENT';

const redactCourseTrainerImages = (course: any) => ({
  ...course,
  trainer: course.trainer
    ? {
        ...course.trainer,
        profilePic: null,
      }
    : course.trainer,
  courseTrainers: Array.isArray(course.courseTrainers)
    ? course.courseTrainers.map((courseTrainer: any) => ({
        ...courseTrainer,
        trainer: courseTrainer.trainer
          ? {
              ...courseTrainer.trainer,
              profilePic: null,
            }
          : courseTrainer.trainer,
      }))
    : course.courseTrainers,
  courseNotes: Array.isArray(course.courseNotes)
    ? course.courseNotes.map((note: any) => ({
        ...note,
        trainer: note.trainer
          ? {
              ...note.trainer,
              profilePic: null,
            }
          : note.trainer,
      }))
    : course.courseNotes,
});

// Get all courses (public) - only show APPROVED courses to clients
// If trainerId is provided, show all trainer's courses regardless of status (for trainer's My Courses page)
router.get('/', authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const { courseType, courseMode, status, trainerId } = req.query;

    const where: any = {};
    if (!trainerId) {
      where.status = 'APPROVED';
    } else if (status) {
      where.status = status;
    }

    // Item-level mark-as-read is handled in the individual GET /:id route

    const courses = await prisma.course.findMany({
      where: {
        ...where,
        // If trainerId is provided, show courses where they are either the owner or a listed trainer
        ...(trainerId ? {
          OR: [
            { trainerId: trainerId as string },
            { courseTrainers: { some: { trainerId: trainerId as string } } }
          ]
        } : {})
      },
      include: {
        trainer: {
          select: {
            id: true,
            customTrainerId: true,
            fullName: true,
            profilePic: true,
          },
        },
        courseTrainers: {
          include: {
            trainer: {
              select: {
                id: true,
                customTrainerId: true,
                fullName: true,
                profilePic: true,
              }
            }
          }
        },
        courseMaterials: true,
        courseNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            trainer: {
              select: {
                id: true,
                fullName: true,
                profilePic: true,
              }
            }
          }
        },
        adminCourseNotes: {
          where: { type: 'TO_TRAINER' },
          orderBy: { createdAt: 'desc' },
        },
        courseReviews: {
          select: {
            rating: true,
            review: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by courseType - check if the filter value exists in the JSON array
    let filteredCourses = courses;
    if (courseType) {
      filteredCourses = filteredCourses.filter(course => {
        // Handle JSON array from database - it might be a JSON object or already parsed array
        let courseTypes: string[] = [];
        if (Array.isArray(course.courseType)) {
          courseTypes = course.courseType as string[];
        } else if (course.courseType) {
          // If it's a JSON string, parse it
          try {
            const parsed = typeof course.courseType === 'string'
              ? JSON.parse(course.courseType)
              : course.courseType;
            courseTypes = Array.isArray(parsed) ? (parsed as string[]) : [];
          } catch {
            courseTypes = [];
          }
        }
        return courseTypes.includes(courseType as string);
      });
    }

    // Filter by courseMode - check if the filter value exists in the JSON array
    if (courseMode) {
      // Map legacy values
      let filterMode = courseMode as string;
      if (filterMode === 'VIRTUAL') filterMode = 'ONLINE';
      if (filterMode === 'BOTH') filterMode = 'HYBRID';

      filteredCourses = filteredCourses.filter(course => {
        // Handle JSON array from database - it might be a JSON object or already parsed array
        let courseModes: string[] = [];
        if (Array.isArray(course.courseMode)) {
          courseModes = course.courseMode as string[];
        } else if (course.courseMode) {
          // If it's a JSON string, parse it
          try {
            const parsed = typeof course.courseMode === 'string'
              ? JSON.parse(course.courseMode)
              : course.courseMode;
            courseModes = Array.isArray(parsed) ? (parsed as string[]) : [];
          } catch {
            courseModes = [];
          }
        }
        return courseModes.includes(filterMode);
      });
    }

    // Calculate ratings from feedbacks for all courses
    const courseIds = filteredCourses.map(c => c.id);
    const ratingsMap = await calculateCourseRatings(courseIds);

    // Add ratings to courses
    const coursesWithRatings = filteredCourses.map(course => ({
      ...course,
      courseRating: ratingsMap.get(course.id) ?? null,
    }));

    const responseCourses = shouldRedactTrainerImages(req)
      ? coursesWithRatings.map(redactCourseTrainerImages)
      : coursesWithRatings;

    return res.json({ courses: responseCourses });
  } catch (error: any) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
});

// Get single course (public) - only show APPROVED courses to clients
router.get('/:id', authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };
    
    // If NOT a trainer/admin, only show APPROVED courses
    if (!req.user || (req.user.role !== 'TRAINER' && req.user.role !== 'ADMIN')) {
      where.status = 'APPROVED';
    }

    const course = await prisma.course.findFirst({
      where,
      include: {
        trainer: {
          select: {
            id: true,
            customTrainerId: true,
            fullName: true,
            profilePic: true,
            professionalBio: true,
          },
        },
        courseTrainers: {
          include: {
            trainer: {
              select: {
                id: true,
                customTrainerId: true,
                fullName: true,
                profilePic: true,
                professionalBio: true,
              }
            }
          }
        },
        courseMaterials: true,
        courseNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            trainer: {
              select: {
                id: true,
                fullName: true,
                profilePic: true,
              }
            }
          }
        },
        adminCourseNotes: {
          where: { type: 'TO_TRAINER' },
          orderBy: { createdAt: 'desc' },
        },
        courseSchedule: {
          orderBy: { dayNumber: 'asc' },
        },
        courseReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Calculate rating from feedbacks
    const courseRating = await calculateCourseRating(course.id);

    // Auto-mark as read if trainer is fetching their own course (owner or co-trainer)
    if (req.user && req.user.role === 'TRAINER') {
        const userId = req.user.id;
        const isAssociated = course.trainerId === userId || 
                           (course.courseTrainers as any[])?.some((ct: any) => ct.trainerId === userId);
        
        if (isAssociated) {
            // Mark status change as read
            const updated = await prisma.course.updateMany({
                where: { id: course.id, isRead: false },
                data: { isRead: true }
            });

            // Mark admin notes as read
            const notesUpdated = await prisma.adminCourseNote.updateMany({
                where: { courseId: course.id, type: 'TO_TRAINER', isRead: false },
                data: { isRead: true }
            });

            if (updated.count > 0 || notesUpdated.count > 0) {
                broadcastUpdate('courses', 'UPDATE', { trainerId: userId });
                broadcastUpdate('admin_course_notes', 'UPDATE', { trainerId: userId });
            }
        }
    }

    const courseWithRating = {
      ...course,
      courseRating,
    };

    return res.json({
      course: shouldRedactTrainerImages(req)
        ? redactCourseTrainerImages(courseWithRating)
        : courseWithRating,
    });
  } catch (error: any) {
    console.error('Get course error:', error);
    return res.status(500).json({ error: 'Failed to fetch course', details: error.message });
  }
});

// Replace entire course schedule (trainer or admin)
router.put(
  '/:id/schedule',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;
      const { items } = req.body as { items: any[] };

      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      if (req.user!.role === 'TRAINER' && existingCourse.trainerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to update this course schedule' });
      }

      await prisma.courseSchedule.deleteMany({
        where: { courseId },
      });

      // New structure: one module per row, multiple rows can share same session
      // Each item can have multiple modules, we need to expand them into separate rows
      const scheduleRows: any[] = [];

      (items || []).forEach((i) => {
        // Get modules - can be array or single string
        const modules = Array.isArray(i.moduleTitle)
          ? i.moduleTitle
          : (i.moduleTitle ? [i.moduleTitle] : []);

        // Ensure submoduleTitle is an array or undefined (Prisma JSON fields use undefined, not null)
        let submoduleTitleArray: string[] | undefined = undefined;
        if (i.submoduleTitle) {
          if (Array.isArray(i.submoduleTitle)) {
            submoduleTitleArray = i.submoduleTitle;
          } else {
            submoduleTitleArray = [i.submoduleTitle];
          }
        }

        // Create one row per module
        modules.forEach((moduleTitle: string) => {
          if (moduleTitle && moduleTitle.trim()) {
            scheduleRows.push({
              courseId,
              dayNumber: i.dayNumber,
              startTime: i.startTime,
              endTime: i.endTime,
              moduleTitle: moduleTitle.trim(), // String, not array
              submoduleTitle: submoduleTitleArray, // JSON array
              durationMinutes: i.durationMinutes,
            });
          }
        });
      });

      const created = await prisma.courseSchedule.createMany({
        data: scheduleRows,
      });

      const schedule = await prisma.courseSchedule.findMany({
        where: { courseId },
        orderBy: [{ dayNumber: 'asc' }, { startTime: 'asc' }],
      });

      // Log schedule update if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'UPDATE',
          entityType: 'course_schedule',
          entityId: courseId,
          description: `Trainer updated schedule for course: ${existingCourse.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.json({ schedule, count: created.count });
    } catch (error: any) {
      console.error('Update course schedule error:', error);
      return res.status(500).json({ error: 'Failed to update course schedule', details: error.message });
    }
  }
);

// Helper function to validate and normalize courseType array
function normalizeCourseType(courseType: any): string[] {
  if (!courseType) return [];
  if (Array.isArray(courseType)) {
    return courseType.filter(t => ['IN_HOUSE', 'PUBLIC'].includes(t));
  }
  // Handle single value case
  if (['IN_HOUSE', 'PUBLIC'].includes(courseType)) {
    return [courseType];
  }
  return [];
}

// Helper function to validate and normalize courseMode array
function normalizeCourseMode(courseMode: any): string[] {
  if (!courseMode) return ['PHYSICAL'];
  if (Array.isArray(courseMode)) {
    // Map VIRTUAL to ONLINE and BOTH to HYBRID
    return courseMode
      .map((m: string) => {
        if (m === 'VIRTUAL') return 'ONLINE';
        if (m === 'BOTH') return 'HYBRID';
        return m;
      })
      .filter((m: string) => ['PHYSICAL', 'ONLINE', 'HYBRID'].includes(m));
  }
  // Handle single value case
  if (courseMode === 'VIRTUAL') return ['ONLINE'];
  if (courseMode === 'BOTH') return ['HYBRID'];
  if (['PHYSICAL', 'ONLINE', 'HYBRID'].includes(courseMode)) {
    return [courseMode];
  }
  return ['PHYSICAL'];
}

// Helper function to validate and normalize category array
function normalizeCategory(category: any): string[] {
  if (!category) return [];
  if (Array.isArray(category)) {
    return category
      .filter(c => c && typeof c === 'string' && c.trim() !== '')
      .map(c => c.trim());
  }
  if (typeof category === 'string' && category.trim() !== '') {
    return [category.trim()];
  }
  return [];
}

// Helper function to validate and normalize deliveryLanguages array
function normalizeDeliveryLanguages(deliveryLanguages: any): string[] {
  if (!deliveryLanguages) return [];
  if (Array.isArray(deliveryLanguages)) {
    return deliveryLanguages
      .filter(l => l && typeof l === 'string' && l.trim() !== '')
      .map(l => l.trim());
  }
  if (typeof deliveryLanguages === 'string' && deliveryLanguages.trim() !== '') {
    return [deliveryLanguages.trim()];
  }
  return [];
}

// Create course (trainer or admin)
router.post(
  '/',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const courseData = req.body;

      // Normalize courseType and courseMode to arrays
      if (courseData.courseType !== undefined) {
        const normalized = normalizeCourseType(courseData.courseType);
        if (normalized.length === 0 && courseData.courseType !== null) {
          return res.status(400).json({ error: 'Invalid courseType. Must be an array containing IN_HOUSE and/or PUBLIC' });
        }
        courseData.courseType = normalized.length > 0 ? normalized : null;
      }
      if (courseData.courseMode !== undefined) {
        const normalized = normalizeCourseMode(courseData.courseMode);
        if (normalized.length === 0 && courseData.courseMode !== null) {
          return res.status(400).json({ error: 'Invalid courseMode. Must be an array containing PHYSICAL, ONLINE, and/or HYBRID' });
        }
        courseData.courseMode = normalized.length > 0 ? normalized : ['PHYSICAL'];
      }

      if (courseData.category !== undefined) {
        courseData.category = normalizeCategory(courseData.category);
      }

      if (courseData.deliveryLanguages !== undefined) {
        courseData.deliveryLanguages = normalizeDeliveryLanguages(courseData.deliveryLanguages);
      }

      let creatorCode: string | null = null;
      let createdBy: string | null = null;

      // If trainer, ensure they're creating their own course
      if (req.user!.role === 'TRAINER') {
        courseData.trainerId = req.user!.id;
        createdBy = req.user!.id;

        // Get trainer's customTrainerId
        const trainer = await prisma.trainer.findUnique({
          where: { id: req.user!.id },
          select: { customTrainerId: true },
        });

        if (trainer?.customTrainerId) {
          creatorCode = trainer.customTrainerId;
        }
      } else if (req.user!.role === 'ADMIN') {
        createdBy = req.user!.id;

        // Get admin's adminCode
        const admin = await prisma.admin.findUnique({
          where: { id: req.user!.id },
          select: { adminCode: true },
        });

        if (admin?.adminCode) {
          creatorCode = admin.adminCode;
        }
      }

      // Generate course code if we have a creator code
      let courseCode: string | null = null;
      if (creatorCode) {
        courseCode = await generateCourseCode(creatorCode);
      }

      // Extract trainerAvailabilityId before creating course (it's not a course field)
      const { trainerAvailabilityId, ...courseCreateData } = courseData;

      // Set default status: DRAFT for trainers, or specified status for admins
      let initialStatus = courseCreateData.status || 'DRAFT';
      // If trainer creates a course with invalid status, change it to PENDING_APPROVAL
      // Courses can only be DRAFT, PENDING_APPROVAL, APPROVED, or DENIED
      if (req.user!.role === 'TRAINER' && !['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'].includes(initialStatus)) {
        initialStatus = 'PENDING_APPROVAL';
      }

      // Round durationHours to integer (database field is Int)
      if (courseCreateData.durationHours) {
        courseCreateData.durationHours = Math.round(parseFloat(String(courseCreateData.durationHours)));
      }

      const course = await prisma.course.create({
        data: {
          ...courseCreateData,
          status: initialStatus,
          courseCode,
          createdBy,
          createdByAdmin: req.user!.role === 'ADMIN',
          // Automatically assign the creator as the PRIMARY trainer
          ...(req.user!.role === 'TRAINER' ? {
            courseTrainers: {
              create: {
                trainerId: req.user!.id,
                role: 'PRIMARY'
              }
            }
          } : {})
        },
        include: {
          trainer: {
            select: {
              id: true,
              customTrainerId: true,
              fullName: true,
              profilePic: true,
            },
          },
          courseTrainers: {
            include: {
              trainer: {
                select: {
                  id: true,
                  customTrainerId: true,
                  fullName: true,
                }
              }
            }
          }
        },
      });

      // Mark trainer availability as BOOKED if trainerAvailabilityId is provided
      if (trainerAvailabilityId && course.fixedDate) {
        try {
          await prisma.trainerAvailability.update({
            where: { id: trainerAvailabilityId },
            data: { status: 'BOOKED' },
          });
        } catch (err) {
          console.error('Error updating trainer availability:', err);
          // Don't fail the course creation if availability update fails
        }
      }

      // Events are now created manually by admin only, not automatically
      // Removed automatic event sync for trainer-created courses

      // Log course creation if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CREATE',
          entityType: 'course',
          entityId: course.id,
          description: `Trainer created a new course (Draft): ${course.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.status(201).json({ course });
    } catch (error: any) {
      console.error('Create course error:', error);
      return res.status(500).json({ error: 'Failed to create course', details: error.message });
    }
  }
);

// Update course (trainer or admin)
router.put(
  '/:id',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;
      const updateData = req.body;

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Trainers can only update their own courses
      if (req.user!.role === 'TRAINER') {
        // Check if trainer owns this course
        if (!existingCourse.trainerId || existingCourse.trainerId !== req.user!.id) {
          return res.status(403).json({
            error: 'Not authorized to update this course. You can only update courses you created.'
          });
        }
        // Also check that trainerId is not being changed in the update
        if (updateData.trainerId && updateData.trainerId !== req.user!.id) {
          return res.status(403).json({ error: 'Cannot change trainer ID of your course' });
        }
      }

      // Sanitize updateData to only include valid fields
      // Allow updating published courses - no restriction on status
      const allowedFields = [
        'title',
        'description',
        'durationHours',
        'durationUnit',
        'courseType',
        'courseMode',
        'category',
        'certificate',
        'assessment',
        'learningObjectives',
        'learningOutcomes',
        'targetAudience',
        'methodology',
        'prerequisite',
        'fixedDate',
        'startDate',
        'endDate',
        'status',
        'venue',
        'price',
        'hrdcClaimable',
        'brochureUrl',
        'imageUrl',
        'professionalDevelopmentPoints',
        'professionalDevelopmentPointsOther',
        'deliveryLanguages',
      ];

      const sanitizedData: any = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (field === 'courseType') {
            const normalized = normalizeCourseType(updateData[field]);
            if (normalized.length === 0 && updateData[field] !== null) {
              throw new Error('Invalid courseType. Must be an array containing IN_HOUSE and/or PUBLIC');
            }
            sanitizedData[field] = normalized.length > 0 ? normalized : null;
          } else if (field === 'courseMode') {
            const normalized = normalizeCourseMode(updateData[field]);
            if (normalized.length === 0 && updateData[field] !== null) {
              throw new Error('Invalid courseMode. Must be an array containing PHYSICAL, ONLINE, and/or HYBRID');
            }
            sanitizedData[field] = normalized.length > 0 ? normalized : null;
          } else if (field === 'durationHours') {
            // durationHours is Int in database, so parse as integer
            sanitizedData[field] = updateData[field] ? Math.round(parseFloat(updateData[field])) : null;
          } else if (field === 'category') {
            sanitizedData[field] = normalizeCategory(updateData[field]);
          } else if (field === 'deliveryLanguages') {
            sanitizedData[field] = normalizeDeliveryLanguages(updateData[field]);
          } else {
            sanitizedData[field] = updateData[field];
          }
        }
      });

      // Ensure trainerId is not changed
      sanitizedData.trainerId = existingCourse.trainerId;

      // Trainers cannot directly publish courses - they need admin approval
      // When trainer updates an existing course, it should go through admin review
      if (req.user!.role === 'TRAINER' && !existingCourse.createdByAdmin) {
        // If trainer is trying to set an invalid status, convert to PENDING_APPROVAL
        // Courses can only be DRAFT, PENDING_APPROVAL, APPROVED, or DENIED
        if (sanitizedData.status && !['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'].includes(sanitizedData.status)) {
          sanitizedData.status = 'PENDING_APPROVAL';
        }
        // Trainers cannot change status to APPROVED - only admins can
        if (sanitizedData.status === 'APPROVED') {
          delete sanitizedData.status;
        }

        // If course is already approved (APPROVED), 
        // any update by trainer should require admin review again
        if (existingCourse.status === 'APPROVED') {
          // Only set to PENDING_APPROVAL if there are actual changes (not just status change)
          // Check if there are any fields being updated (excluding status field itself)
          const hasOtherChanges = Object.keys(sanitizedData).some(
            key => key !== 'status' && sanitizedData[key] !== undefined
          );

          if (hasOtherChanges) {
            sanitizedData.status = 'PENDING_APPROVAL';
          } else if (sanitizedData.status && sanitizedData.status !== existingCourse.status) {
            // If only status is being changed, prevent trainers from changing approved courses
            delete sanitizedData.status;
          }
        }
      }

      // Handle trainer availability changes
      const { trainerAvailabilityId } = updateData;
      const oldFixedDate = existingCourse.fixedDate;
      const newFixedDate = sanitizedData.fixedDate;

      // If fixedDate is being changed, update availability accordingly
      if (oldFixedDate !== newFixedDate && existingCourse.trainerId) {
        // If old fixedDate existed, mark that availability as AVAILABLE again
        if (oldFixedDate) {
          try {
            const oldDate = new Date(oldFixedDate);
            oldDate.setHours(0, 0, 0, 0);
            const oldAvailability = await prisma.trainerAvailability.findFirst({
              where: {
                trainerId: existingCourse.trainerId,
                date: oldDate,
                status: 'BOOKED',
              },
            });
            if (oldAvailability) {
              await prisma.trainerAvailability.update({
                where: { id: oldAvailability.id },
                data: { status: 'AVAILABLE' },
              });
            }
          } catch (err) {
            console.error('Error releasing old availability:', err);
          }
        }

        // If new fixedDate is set and trainerAvailabilityId is provided, mark it as BOOKED
        if (newFixedDate && trainerAvailabilityId) {
          try {
            await prisma.trainerAvailability.update({
              where: { id: trainerAvailabilityId },
              data: { status: 'BOOKED' },
            });
          } catch (err) {
            console.error('Error booking new availability:', err);
          }
        }
      } else if (newFixedDate && trainerAvailabilityId && !oldFixedDate) {
        // If setting fixedDate for the first time
        try {
          await prisma.trainerAvailability.update({
            where: { id: trainerAvailabilityId },
            data: { status: 'BOOKED' },
          });
        } catch (err) {
          console.error('Error booking availability:', err);
        }
      }

      const course = await prisma.course.update({
        where: { id: courseId },
        data: sanitizedData,
        include: {
          trainer: {
            select: {
              id: true,
              customTrainerId: true,
              fullName: true,
              profilePic: true,
            },
          },
        },
      });

      // Events are now created manually by admin only, not automatically
      // Removed automatic event sync for trainer course updates

      // Log course update if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'UPDATE',
          entityType: 'course',
          entityId: course.id,
          description: `Trainer updated course: ${course.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.json({ course });
    } catch (error: any) {
      console.error('Update course error:', error);
      return res.status(500).json({ error: 'Failed to update course', details: error.message });
    }
  }
);

// Delete course (trainer or admin)
router.delete(
  '/:id',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;

      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Trainers can only delete their own courses
      if (req.user!.role === 'TRAINER' && existingCourse.trainerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete this course' });
      }

      await prisma.course.delete({
        where: { id: courseId },
      });

      // Log course deletion if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'DELETE',
          entityType: 'course',
          entityId: courseId,
          description: `Trainer deleted course: ${existingCourse.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
      console.error('Delete course error:', error);
      return res.status(500).json({ error: 'Failed to delete course', details: error.message });
    }
  }
);

// Upload course material (trainer or admin)
router.post(
  '/:id/materials',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  uploadMaterial.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        // Delete uploaded file if course doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Course not found' });
      }

      // Trainers can only upload materials to their own courses
      if (req.user!.role === 'TRAINER' && course.trainerId !== req.user!.id) {
        // Delete uploaded file if unauthorized
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Not authorized to upload materials to this course' });
      }

      // Generate file URL (relative to /uploads)
      const fileUrl = `/uploads/course-materials/${req.file.filename}`;

      // Create material record
      const material = await prisma.courseMaterial.create({
        data: {
          courseId,
          fileUrl,
          fileName: req.file.originalname,
        },
      });

      // Log material upload if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CREATE',
          entityType: 'course_material',
          entityId: material.id,
          description: `Trainer uploaded material: ${material.fileName} for course: ${course.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.status(201).json({ material });
    } catch (error: any) {
      // Delete uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload course material error:', error);
      return res.status(500).json({ error: 'Failed to upload course material', details: error.message });
    }
  }
);

// Delete course material (trainer or admin)
router.delete(
  '/:id/materials/:materialId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { id: courseId, materialId } = req.params;

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if material exists
      const material = await prisma.courseMaterial.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      // Verify material belongs to this course
      if (material.courseId !== courseId) {
        return res.status(400).json({ error: 'Material does not belong to this course' });
      }

      // Trainers can only delete materials from their own courses
      if (req.user!.role === 'TRAINER' && course.trainerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete materials from this course' });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../', material.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete material record
      await prisma.courseMaterial.delete({
        where: { id: materialId },
      });

      // Log material deletion if trainer
      if (req.user!.role === 'TRAINER') {
        await createActivityLog({
          userId: req.user!.id,
          actionType: 'DELETE',
          entityType: 'course_material',
          entityId: materialId,
          description: `Trainer deleted material: ${material.fileName} from course: ${course.title}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      return res.json({ message: 'Material deleted successfully' });
    } catch (error: any) {
      console.error('Delete course material error:', error);
      return res.status(500).json({ error: 'Failed to delete course material', details: error.message });
    }
  }
);

// Upload course image (trainer or admin)
router.post(
  '/:id/image',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  uploadMaterial.single('image'),
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Course not found' });
      }

      // Trainers can only upload images to their own courses
      if (req.user!.role === 'TRAINER' && course.trainerId !== req.user!.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Not authorized to upload images to this course' });
      }

      // Generate image URL
      const imageUrl = `/uploads/course-images/${req.file.filename}`;

      // Ensure directory exists (uploadMiddleware might handle this, but let's be safe)
      const dir = path.join(__dirname, '../../uploads/course-images');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Update course record
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { imageUrl },
      });

      return res.json({ course: updatedCourse });
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload course image error:', error);
      return res.status(500).json({ error: 'Failed to upload course image', details: error.message });
    }
  }
);

export default router;
