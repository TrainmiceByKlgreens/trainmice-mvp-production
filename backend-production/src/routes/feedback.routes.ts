import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';

const router = express.Router();

// Get feedback form data for an event (public endpoint)
router.get('/form/:eventId', async (req, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ['APPROVED', 'REGISTERED'],
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Calculate attendance from registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: {
          in: ['APPROVED', 'REGISTERED'],
        },
      },
      select: {
        numberOfParticipants: true,
      },
    });

    const attendance = registrations.reduce(
      (sum, reg) => sum + (reg.numberOfParticipants || 1),
      0
    );

    // Format course duration
    const courseDuration = `${event.durationHours} ${event.durationUnit || 'hours'}`;

    return res.json({
      event: {
        id: event.id,
        title: event.title,
        courseName: event.title, // Using event title as course name
        courseDate: event.eventDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        courseDuration,
        attendance: attendance.toString(),
        trainerId: event.trainerId,
        courseId: event.courseId,
      },
    });
  } catch (error: any) {
    console.error('Get feedback form error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch feedback form data', 
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Submit feedback (public endpoint)
router.post(
  '/submit',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('participantName').notEmpty().withMessage('Participant name is required'),
    body('contentClarity').optional().isInt({ min: 1, max: 5 }).withMessage('Content clarity must be between 1 and 5'),
    body('objectivesAchieved').optional().isInt({ min: 1, max: 5}).withMessage('Objectives achieved must be between 1 and 5'),
    body('materialsHelpful').optional().isInt({ min: 1, max: 5}).withMessage('Materials helpful must be between 1 and 5'),
    body('learningEnvironment').optional().isInt({ min: 1, max: 5}).withMessage('Learning environment must be between 1 and 5'),
    body('trainerKnowledge').optional().isInt({ min: 1, max: 5}).withMessage('Trainer knowledge must be between 1 and 5'),
    body('trainerEngagement').optional().isInt({ min: 1, max: 5}).withMessage('Trainer engagement must be between 1 and 5'),
    body('knowledgeExposure').optional().isInt({ min: 1, max: 5}).withMessage('Knowledge exposure must be between 1 and 5'),
    body('knowledgeApplication').optional().isInt({ min: 1, max: 5}).withMessage('Knowledge application must be between 1 and 5'),
    body('durationSuitable').optional().isInt({ min: 1, max: 5}).withMessage('Duration suitable must be between 1 and 5'),
    body('recommendCourse').optional().isInt({ min: 1, max: 5}).withMessage('Recommend course must be between 1 and 5'),
    body('recommendColleagues').optional().isBoolean(),
  ],
  async (req: express.Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        eventId,
        participantName,
        contentClarity,
        objectivesAchieved,
        materialsHelpful,
        learningEnvironment,
        trainerKnowledge,
        trainerEngagement,
        knowledgeExposure,
        knowledgeApplication,
        durationSuitable,
        recommendCourse,
        likedMost,
        improvementSuggestion,
        additionalComments,
        recommendColleagues,
        referralDetails,
        futureTrainingTopics,
        inhouseTrainingNeeds,
        teamBuildingInterest,
      } = req.body;

      // Get event data to auto-fill hidden fields
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          trainer: {
            select: {
              id: true,
            },
          },
          course: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  status: {
                    in: ['APPROVED', 'REGISTERED'],
                  },
                },
              },
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Calculate attendance
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          status: {
            in: ['APPROVED', 'REGISTERED'],
          },
        },
        select: {
          numberOfParticipants: true,
        },
      });

      const attendance = registrations.reduce(
        (sum, reg) => sum + (reg.numberOfParticipants || 1),
        0
      );

      const courseDuration = `${event.durationHours} ${event.durationUnit || 'hours'}`;

      // Create feedback record
      const feedback = await prisma.feedback.create({
        data: {
          eventId: event.id,
          trainerId: event.trainerId || null,
          courseId: event.courseId,
          courseName: event.title,
          courseDate: event.eventDate,
          courseDuration,
          attendance: attendance.toString(),
          participantName,
          contentClarity: contentClarity ? parseInt(String(contentClarity)) : null,
          objectivesAchieved: objectivesAchieved ? parseInt(String(objectivesAchieved)) : null,
          materialsHelpful: materialsHelpful ? parseInt(String(materialsHelpful)) : null,
          learningEnvironment: learningEnvironment ? parseInt(String(learningEnvironment)) : null,
          trainerKnowledge: trainerKnowledge ? parseInt(String(trainerKnowledge)) : null,
          trainerEngagement: trainerEngagement ? parseInt(String(trainerEngagement)) : null,
          knowledgeExposure: knowledgeExposure ? parseInt(String(knowledgeExposure)) : null,
          knowledgeApplication: knowledgeApplication ? parseInt(String(knowledgeApplication)) : null,
          durationSuitable: durationSuitable ? parseInt(String(durationSuitable)) : null,
          recommendCourse: recommendCourse ? parseInt(String(recommendCourse)) : null,
          likedMost: likedMost || null,
          improvementSuggestion: improvementSuggestion || null,
          additionalComments: additionalComments || null,
          recommendColleagues: recommendColleagues === true || recommendColleagues === 'true',
          referralDetails: referralDetails || null,
          futureTrainingTopics: futureTrainingTopics || null,
          inhouseTrainingNeeds: inhouseTrainingNeeds || null,
          teamBuildingInterest: teamBuildingInterest || null,
        },
      });

      return res.json({
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback.id,
        },
      });
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      return res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
    }
  }
);

// Generate QR code for event feedback form (admin only)
router.get('/qr/:eventId', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const baseUrl = process.env.FRONTEND_URL_CLIENT || 'http://localhost:5173';
    const feedbackUrl = `${baseUrl}/feedback/${eventId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(feedbackUrl, {
      width: 300,
      margin: 2,
    });

    return res.json({
      qrCode: qrCodeDataUrl,
      url: feedbackUrl,
      eventId,
    });
  } catch (error: any) {
    console.error('Generate QR code error:', error);
    return res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
  }
});

// Get feedback analytics (admin only)
router.get('/analytics', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventCode, courseCode, trainerId, courseDate } = req.query;

    const where: any = {};
    
    // Filter by Event Code
    // Logic: eventCode → find event.id where event.eventCode = eventCode → filter by eventId
    if (eventCode) {
      const event = await prisma.event.findUnique({
        where: { eventCode: eventCode as string },
        select: { id: true }
      });
      if (event) {
        where.eventId = event.id;
      } else {
        // If event code not found, return empty results
        return res.json({ feedbacks: [], summary: { total: 0, averages: {} } });
      }
    }
    
    // Filter by Course Code
    // Logic: courseCode → find course.id where course.courseCode = courseCode → filter by courseId
    if (courseCode) {
      const course = await prisma.course.findFirst({
        where: { courseCode: courseCode as string },
        select: { id: true }
      });
      if (course) {
        where.courseId = course.id;
      } else {
        // If course code not found, return empty results
        return res.json({ feedbacks: [], summary: { total: 0, averages: {} } });
      }
    }
    
    // Filter by Trainer ID (direct - already supported)
    if (trainerId) {
      where.trainerId = trainerId as string;
    }
    
    // Filter by Course Date (direct - already supported)
    if (courseDate) {
      where.courseDate = new Date(courseDate as string);
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventCode: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average scores per question
    const calculateAverage = (field: keyof typeof feedbacks[0]) => {
      const values = feedbacks
        .map((f: any) => f[field])
        .filter((v: any) => v !== null && v !== undefined && typeof v === 'number');
      if (values.length === 0) return null;
      return values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    };

    const averages = {
      contentClarity: calculateAverage('contentClarity'),
      objectivesAchieved: calculateAverage('objectivesAchieved'),
      materialsHelpful: calculateAverage('materialsHelpful'),
      learningEnvironment: calculateAverage('learningEnvironment'),
      trainerKnowledge: calculateAverage('trainerKnowledge'),
      trainerEngagement: calculateAverage('trainerEngagement'),
      knowledgeExposure: calculateAverage('knowledgeExposure'),
      knowledgeApplication: calculateAverage('knowledgeApplication'),
      durationSuitable: calculateAverage('durationSuitable'),
      recommendCourse: calculateAverage('recommendCourse'),
    };

    return res.json({
      feedbacks,
      summary: {
        total: feedbacks.length,
        averages,
      },
    });
  } catch (error: any) {
    console.error('Get feedback analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch feedback analytics', details: error.message });
  }
});

export default router;
