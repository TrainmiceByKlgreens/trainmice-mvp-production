import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import jwt from 'jsonwebtoken';
import { calculateTrainerRating, calculateTrainerRatings } from '../utils/utils/ratingCalculator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

// Analytics KPIs interface
interface AnalyticsKPIs {
  trainer_id: string;
  applied_filters: {
    course_id: string | null;
    course_date: string | null;
  };
  overall_star_rating: number;
  rating_breakdown: {
    q_content_clarity: number;
    q_objectives_achieved: number;
    q_materials_helpful: number;
    q_environment_learning: number;
    q_trainer_knowledge: number;
    q_engagement: number;
    q_new_knowledge: number;
    q_application_understanding: number;
    q_recommend_course: number;
  };
  participation_metrics: {
    total_participants: number;
    total_sessions: number;
    repeat_participants: number;
    average_attendance_duration: number;
  };
  sentiment_insights: {
    top_positive_words: string[];
    top_improvement_words: string[];
    sentiment_category: string;
  };
  followup_metrics: {
    needs_followup: number;
    top_followup_reasons: string[];
    inhouse_training_interest: number;
    team_building_interest: number;
  };
  referral_metrics: {
    referral_count: number;
    referral_keywords: string[];
  };
  training_demand: {
    top_requested_topics: string[];
    team_building_demand: string;
    inhouse_training_demand: string;
  };
  events_last_6_months: any[];
  strengths: string[];
  improvement_areas: string[];
  insight_summary: string;
}

// Get all trainers (public)
router.get('/', async (_req, res) => {
  try {
    const trainers = await prisma.trainer.findMany({
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            courseType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate ratings from feedbacks for all trainers
    const trainerIds = trainers.map(t => t.id);
    const ratingsMap = await calculateTrainerRatings(trainerIds);

    // Add ratings to trainers
    const trainersWithRating = trainers.map(trainer => ({
      ...trainer,
      avgRating: ratingsMap.get(trainer.id) ?? null,
      courseCount: trainer.courses.length,
    }));

    return res.json({ trainers: trainersWithRating });
  } catch (error: any) {
    console.error('Get trainers error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainers', details: error.message });
  }
});

// Get single trainer (public - excludes sensitive info for non-authenticated users)
router.get('/:id', async (req: any, res) => {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: req.params.id },
      include: {
        courses: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            title: true,
            description: true,
            courseType: true,
            durationHours: true,
          },
        },
        courseReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        qualifications: {
          orderBy: { yearObtained: 'desc' },
        },
        workHistoryEntries: {
          orderBy: { startDate: 'desc' },
        },
        pastClients: {
          orderBy: { year: 'desc' },
        },
      },
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Calculate rating from feedbacks
    const trainerRating = await calculateTrainerRating(trainer.id);

    // Check if request is from authenticated trainer viewing their own profile
    let isOwnProfile = false;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          email: string;
          role: string;
        };
        isOwnProfile = decoded.userId === req.params.id && decoded.role === 'TRAINER';
      }
    } catch (e) {
      // Not authenticated or invalid token - treat as public access
    }

    // For public access (clients), exclude sensitive information
    if (!isOwnProfile) {
      const publicTrainer: any = {
        ...trainer,
        fullName: null, // Hide name
        phoneNumber: null, // Hide phone
        email: null, // Hide email
        icNumber: null, // Hide IC number
        avgRating: trainerRating, // Add rating from feedbacks
        // Keep: professionalBio, customTrainerId, qualifications, pastClients, courses, ratings
      };
      // Remove undefined fields
      Object.keys(publicTrainer).forEach(key => {
        if (publicTrainer[key] === undefined) {
          delete publicTrainer[key];
        }
      });
      return res.json({ trainer: publicTrainer });
    } else {
      return res.json({
        trainer: {
          ...trainer,
          avgRating: trainerRating, // Add rating from feedbacks
        }
      });
    }
  } catch (error: any) {
    console.error('Get trainer error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer', details: error.message });
  }
});

// Basic analytics for a trainer based on feedbacks table
router.get('/:id/analytics', authenticate, authorize('TRAINER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const trainerId = req.params.id;

    if (req.user!.role === 'TRAINER' && req.user!.id !== trainerId) {
      return res.status(403).json({ error: 'Not authorized to view analytics for this trainer' });
    }

    const { courseId, courseDate } = req.query as { courseId?: string; courseDate?: string };

    const where: any = { trainerId };
    // Only add courseId filter if it's provided and not empty
    if (courseId && courseId.trim() !== '') {
      where.courseId = courseId;
    }

    // Fetch feedbacks instead of courseReviews
    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Filter by courseDate if provided
    let filteredFeedbacks = feedbacks;
    if (courseDate) {
      const target = new Date(courseDate);
      filteredFeedbacks = feedbacks.filter((f) => {
        if (!f.courseDate) return false;
        const d = new Date(f.courseDate);
        return d.toDateString() === target.toDateString();
      });
    }

    if (filteredFeedbacks.length === 0) {
      const analytics: AnalyticsKPIs = {
        trainer_id: trainerId,
        applied_filters: {
          course_id: courseId || null,
          course_date: courseDate || null,
        },
        overall_star_rating: 0,
        rating_breakdown: {
          q_content_clarity: 0,
          q_objectives_achieved: 0,
          q_materials_helpful: 0,
          q_environment_learning: 0,
          q_trainer_knowledge: 0,
          q_engagement: 0,
          q_new_knowledge: 0,
          q_application_understanding: 0,
          q_recommend_course: 0,
        },
        participation_metrics: {
          total_participants: 0,
          total_sessions: 0,
          repeat_participants: 0,
          average_attendance_duration: 0,
        },
        sentiment_insights: {
          top_positive_words: [],
          top_improvement_words: [],
          sentiment_category: 'Neutral',
        },
        followup_metrics: {
          needs_followup: 0,
          top_followup_reasons: [],
          inhouse_training_interest: 0,
          team_building_interest: 0,
        },
        referral_metrics: {
          referral_count: 0,
          referral_keywords: [],
        },
        training_demand: {
          top_requested_topics: [],
          team_building_demand: 'Low',
          inhouse_training_demand: 'Low',
        },
        events_last_6_months: [],
        strengths: [],
        improvement_areas: [],
        insight_summary: 'No feedback data available yet.',
      };
      return res.json({ analytics });
    }

    // Calculate averages for each rating question
    const calculateAverage = (field: keyof typeof filteredFeedbacks[0]) => {
      const values = filteredFeedbacks
        .map((f) => f[field])
        .filter((v): v is number => v !== null && v !== undefined);
      return values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;
    };

    const qContentClarity = calculateAverage('contentClarity');
    const qObjectivesAchieved = calculateAverage('objectivesAchieved');
    const qMaterialsHelpful = calculateAverage('materialsHelpful');
    const qEnvironmentLearning = calculateAverage('learningEnvironment');
    const qTrainerKnowledge = calculateAverage('trainerKnowledge');
    const qEngagement = calculateAverage('trainerEngagement');
    const qNewKnowledge = calculateAverage('knowledgeExposure');
    const qApplicationUnderstanding = calculateAverage('knowledgeApplication');
    const qRecommendCourse = calculateAverage('recommendCourse');

    // Overall rating is average of all ratings
    const allRatings = [
      qContentClarity,
      qObjectivesAchieved,
      qMaterialsHelpful,
      qEnvironmentLearning,
      qTrainerKnowledge,
      qEngagement,
      qNewKnowledge,
      qApplicationUnderstanding,
      qRecommendCourse,
    ].filter((r) => r > 0);
    const overall = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : 0;

    // Extract positive and improvement feedback
    const positiveFeedbacks = filteredFeedbacks
      .map((f) => f.likedMost)
      .filter((f): f is string => !!f);
    const improvementFeedbacks = filteredFeedbacks
      .map((f) => f.improvementSuggestion)
      .filter((f): f is string => !!f);

    // Extract requested topics
    const requestedTopics = filteredFeedbacks
      .map((f) => f.futureTrainingTopics)
      .filter((t): t is string => !!t)
      .join(' ')
      .split(/\s+/)
      .filter((t) => t.length > 3);

    // Count team building and in-house interest
    const teamBuildingInterest = filteredFeedbacks.filter((f) =>
      f.teamBuildingInterest && f.teamBuildingInterest.toLowerCase().includes('yes')
    ).length;
    const inhouseTrainingInterest = filteredFeedbacks.filter((f) =>
      f.likedMost && f.likedMost.toLowerCase().includes('in-house')
    ).length;

    // Calculate participation metrics
    const uniqueParticipants = new Set(
      filteredFeedbacks.map((f) => f.participantName).filter((n): n is string => !!n)
    ).size;

    // Get course dates for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentFeedbacks = filteredFeedbacks.filter((f) => {
      if (!f.courseDate) return false;
      return new Date(f.courseDate) >= sixMonthsAgo;
    });

    const eventsByMonth = new Map<string, number>();
    recentFeedbacks.forEach((f) => {
      if (f.courseDate) {
        const date = new Date(f.courseDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        eventsByMonth.set(monthKey, (eventsByMonth.get(monthKey) || 0) + 1);
      }
    });

    const events_last_6_months = Array.from(eventsByMonth.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    const analytics: AnalyticsKPIs = {
      trainer_id: trainerId,
      applied_filters: {
        course_id: courseId || null,
        course_date: courseDate || null,
      },
      overall_star_rating: overall,
      rating_breakdown: {
        q_content_clarity: qContentClarity,
        q_objectives_achieved: qObjectivesAchieved,
        q_materials_helpful: qMaterialsHelpful,
        q_environment_learning: qEnvironmentLearning,
        q_trainer_knowledge: qTrainerKnowledge,
        q_engagement: qEngagement,
        q_new_knowledge: qNewKnowledge,
        q_application_understanding: qApplicationUnderstanding,
        q_recommend_course: qRecommendCourse,
      },
      participation_metrics: {
        total_participants: uniqueParticipants,
        total_sessions: filteredFeedbacks.length,
        repeat_participants: 0, // Would need to track this separately
        average_attendance_duration: 0, // Would need to calculate from attendanceDuration
      },
      sentiment_insights: {
        top_positive_words: positiveFeedbacks.slice(0, 5),
        top_improvement_words: improvementFeedbacks.slice(0, 5),
        sentiment_category: overall >= 4 ? 'Positive' : overall >= 3 ? 'Neutral' : 'Negative',
      },
      followup_metrics: {
        needs_followup: improvementFeedbacks.length,
        top_followup_reasons: improvementFeedbacks.slice(0, 3),
        inhouse_training_interest: inhouseTrainingInterest,
        team_building_interest: teamBuildingInterest,
      },
      referral_metrics: {
        referral_count: filteredFeedbacks.filter((f) => f.referralDetails && f.referralDetails.trim().length > 0).length,
        referral_keywords: filteredFeedbacks
          .map((f) => f.referralDetails)
          .filter((r): r is string => !!r)
          .slice(0, 5),
      },
      training_demand: {
        top_requested_topics: requestedTopics.slice(0, 5),
        team_building_demand: teamBuildingInterest > 0 ? 'Medium' : 'Low',
        inhouse_training_demand: inhouseTrainingInterest > 0 ? 'Medium' : 'Low',
      },
      events_last_6_months: events_last_6_months,
      strengths: positiveFeedbacks.slice(0, 3),
      improvement_areas: improvementFeedbacks.slice(0, 3),
      insight_summary:
        filteredFeedbacks.length === 0
          ? 'No feedback data available yet.'
          : `Average rating from ${filteredFeedbacks.length} feedback(s) is ${overall.toFixed(1)} stars.`,
    };

    return res.json({ analytics });
  } catch (error: any) {
    console.error('Trainer analytics error:', error);
    return res.status(500).json({ error: 'Failed to generate analytics', details: error.message });
  }
});

// Helper endpoints for analytics filters
router.get('/:id/analytics/courses', authenticate, authorize('TRAINER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const trainerId = req.params.id;

    if (req.user!.role === 'TRAINER' && req.user!.id !== trainerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only return courses that have feedbacks
    const feedbacks = await prisma.feedback.findMany({
      where: { trainerId },
      select: { courseId: true },
      distinct: ['courseId'],
    });

    const courseIds = feedbacks
      .map((f) => f.courseId)
      .filter((id): id is string => !!id);

    if (courseIds.length === 0) {
      return res.json({ courses: [] });
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        trainerId,
      },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });

    return res.json({ courses });
  } catch (error: any) {
    console.error('Trainer analytics courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics courses', details: error.message });
  }
});

router.get(
  '/:id/analytics/course-dates',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;

      if (req.user!.role === 'TRAINER' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { courseId } = req.query as { courseId?: string };
      if (!courseId) {
        return res.json({ dates: [] });
      }

      // Fetch from feedbacks table instead of courseReview
      const feedbacks = await prisma.feedback.findMany({
        where: { trainerId, courseId },
        select: { courseDate: true },
        orderBy: { courseDate: 'desc' },
      });

      const dates = Array.from(
        new Set(
          feedbacks
            .map((f) => f.courseDate)
            .filter((d): d is Date => !!d)
            .map((d) => d.toISOString().split('T')[0])
        )
      );

      return res.json({ dates });
    } catch (error: any) {
      console.error('Trainer analytics course dates error:', error);
      return res.status(500).json({ error: 'Failed to fetch course dates', details: error.message });
    }
  }
);

// Update trainer profile (trainer only)
router.put(
  '/:id',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;

      // Trainers can only update their own profile, Admins can update any
      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized to update this profile' });
      }

      // Sanitize updateData to only include valid Prisma fields
      const allowedFields = [
        'profilePic',
        'icNumber',
        'fullName',
        'race',
        'phoneNumber',
        'email',
        'hrdcAccreditationId',
        'hrdcAccreditationValidUntil',
        'professionalBio',
        'state',
        'city',
        'country',
        'areasOfExpertise',
        'languagesSpoken',
        'qualification', // JSON field
        'workHistory', // JSON field
      ];

      const updateData: any = {};
      Object.keys(req.body).forEach((key) => {
        // Convert snake_case to camelCase and check if it's allowed
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        if (allowedFields.includes(camelKey)) {
          updateData[camelKey] = req.body[key];
        }
      });

      // Handle date conversion for hrdcAccreditationValidUntil
      if (updateData.hrdcAccreditationValidUntil) {
        updateData.hrdcAccreditationValidUntil = new Date(updateData.hrdcAccreditationValidUntil);
      }

      const trainer = await prisma.trainer.update({
        where: { id: trainerId },
        data: updateData,
      });

      // Log profile update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'trainer',
        entityId: trainerId,
        description: `Trainer ${trainer.fullName} updated their profile`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ trainer });
    } catch (error: any) {
      console.error('Update trainer error:', error);
      return res.status(500).json({ error: 'Failed to update trainer', details: error.message });
    }
  }
);

// ============================================================================
// QUALIFICATIONS CRUD
// ============================================================================

// Get all qualifications for a trainer
router.get('/:id/qualifications', async (req, res) => {
  try {
    const qualifications = await prisma.qualification.findMany({
      where: { trainerId: req.params.id },
      orderBy: { yearObtained: 'desc' },
    });
    return res.json({ qualifications });
  } catch (error: any) {
    console.error('Get qualifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch qualifications', details: error.message });
  }
});

// Create qualification (trainer only)
router.post(
  '/:id/qualifications',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const qualification = await prisma.qualification.create({
        data: {
          trainerId,
          ...req.body,
        },
      });

      // Log qualification creation
      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'qualification',
        entityId: qualification.id,
        description: `Trainer added a new qualification: ${qualification.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(201).json({ qualification });
    } catch (error: any) {
      console.error('Create qualification error:', error);
      return res.status(500).json({ error: 'Failed to create qualification', details: error.message });
    }
  }
);

// Update qualification (trainer only)
router.put(
  '/:id/qualifications/:qualId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const qualId = req.params.qualId;

      const existing = await prisma.qualification.findUnique({
        where: { id: qualId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Qualification not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const qualification = await prisma.qualification.update({
        where: { id: qualId },
        data: req.body,
      });

      // Log qualification update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'qualification',
        entityId: qualification.id,
        description: `Trainer updated qualification: ${qualification.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ qualification });
    } catch (error: any) {
      console.error('Update qualification error:', error);
      return res.status(500).json({ error: 'Failed to update qualification', details: error.message });
    }
  }
);

// Delete qualification (trainer only)
router.delete(
  '/:id/qualifications/:qualId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const qualId = req.params.qualId;

      const existing = await prisma.qualification.findUnique({
        where: { id: qualId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Qualification not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.qualification.delete({
        where: { id: qualId },
      });

      // Log qualification deletion
      await createActivityLog({
        userId: trainerId,
        actionType: 'DELETE',
        entityType: 'qualification',
        entityId: qualId,
        description: `Trainer deleted qualification: ${existing.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ message: 'Qualification deleted successfully' });
    } catch (error: any) {
      console.error('Delete qualification error:', error);
      return res.status(500).json({ error: 'Failed to delete qualification', details: error.message });
    }
  }
);

// ============================================================================
// WORK HISTORY CRUD
// ============================================================================

// Get all work history for a trainer
router.get('/:id/work-history', async (req, res) => {
  try {
    const workHistory = await prisma.workHistory.findMany({
      where: { trainerId: req.params.id },
      orderBy: { endDate: 'desc' },
    });
    return res.json({ workHistory });
  } catch (error: any) {
    console.error('Get work history error:', error);
    return res.status(500).json({ error: 'Failed to fetch work history', details: error.message });
  }
});

// Create work history (trainer only, max 5)
router.post(
  '/:id/work-history',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check limit
      const count = await prisma.workHistory.count({
        where: { trainerId },
      });

      if (count >= 5) {
        return res.status(400).json({ error: 'Maximum 5 work history entries allowed' });
      }

      const workHistory = await prisma.workHistory.create({
        data: {
          trainerId,
          ...req.body,
        },
      });

      // Log work history creation
      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'work_history',
        entityId: workHistory.id,
        description: `Trainer added work history at ${workHistory.company}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(201).json({ workHistory });
    } catch (error: any) {
      console.error('Create work history error:', error);
      return res.status(500).json({ error: 'Failed to create work history', details: error.message });
    }
  }
);

// Update work history (trainer only)
router.put(
  '/:id/work-history/:workId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const workId = req.params.workId;

      const existing = await prisma.workHistory.findUnique({
        where: { id: workId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Work history not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const workHistory = await prisma.workHistory.update({
        where: { id: workId },
        data: req.body,
      });

      // Log work history update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'work_history',
        entityId: workHistory.id,
        description: `Trainer updated work history at ${workHistory.company}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ workHistory });
    } catch (error: any) {
      console.error('Update work history error:', error);
      return res.status(500).json({ error: 'Failed to update work history', details: error.message });
    }
  }
);

// Delete work history (trainer only)
router.delete(
  '/:id/work-history/:workId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const workId = req.params.workId;

      const existing = await prisma.workHistory.findUnique({
        where: { id: workId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Work history not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.workHistory.delete({
        where: { id: workId },
      });

      // Log work history deletion
      await createActivityLog({
        userId: trainerId,
        actionType: 'DELETE',
        entityType: 'work_history',
        entityId: workId,
        description: `Trainer deleted work history at ${existing.company}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ message: 'Work history deleted successfully' });
    } catch (error: any) {
      console.error('Delete work history error:', error);
      return res.status(500).json({ error: 'Failed to delete work history', details: error.message });
    }
  }
);

// ============================================================================
// PAST CLIENTS CRUD
// ============================================================================

// Get all past clients for a trainer
router.get('/:id/past-clients', async (req, res) => {
  try {
    const pastClients = await prisma.pastClient.findMany({
      where: { trainerId: req.params.id },
      orderBy: { year: 'desc' },
    });
    return res.json({ pastClients });
  } catch (error: any) {
    console.error('Get past clients error:', error);
    return res.status(500).json({ error: 'Failed to fetch past clients', details: error.message });
  }
});

// Create past client (trainer only, max 5)
router.post(
  '/:id/past-clients',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check limit
      const count = await prisma.pastClient.count({
        where: { trainerId },
      });

      if (count >= 5) {
        return res.status(400).json({ error: 'Maximum 5 past clients allowed' });
      }

      const pastClient = await prisma.pastClient.create({
        data: {
          trainerId,
          ...req.body,
        },
      });

      // Log past client creation
      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'past_client',
        entityId: pastClient.id,
        description: `Trainer added past client: ${pastClient.clientName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(201).json({ pastClient });
    } catch (error: any) {
      console.error('Create past client error:', error);
      return res.status(500).json({ error: 'Failed to create past client', details: error.message });
    }
  }
);

// Update past client (trainer only)
router.put(
  '/:id/past-clients/:clientId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const clientId = req.params.clientId;

      const existing = await prisma.pastClient.findUnique({
        where: { id: clientId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Past client not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const pastClient = await prisma.pastClient.update({
        where: { id: clientId },
        data: req.body,
      });

      // Log past client update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'past_client',
        entityId: pastClient.id,
        description: `Trainer updated past client: ${pastClient.clientName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ pastClient });
    } catch (error: any) {
      console.error('Update past client error:', error);
      return res.status(500).json({ error: 'Failed to update past client', details: error.message });
    }
  }
);

// Delete past client (trainer only)
router.delete(
  '/:id/past-clients/:clientId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const clientId = req.params.clientId;

      const existing = await prisma.pastClient.findUnique({
        where: { id: clientId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Past client not found' });
      }

      if (req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.pastClient.delete({
        where: { id: clientId },
      });

      // Log past client deletion
      await createActivityLog({
        userId: trainerId,
        actionType: 'DELETE',
        entityType: 'past_client',
        entityId: clientId,
        description: `Trainer deleted past client: ${existing.clientName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ message: 'Past client deleted successfully' });
    } catch (error: any) {
      console.error('Delete past client error:', error);
      return res.status(500).json({ error: 'Failed to delete past client', details: error.message });
    }
  }
);

// ============================================================================
// TRAINER COURSES CONDUCTED CRUD
// ============================================================================

// Get all courses conducted for a trainer
router.get('/:id/courses-conducted', async (req, res) => {
  try {
    const coursesConducted = await prisma.trainerCourseConducted.findMany({
      where: { trainerId: req.params.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { dateConducted: 'desc' },
    });
    return res.json({ coursesConducted });
  } catch (error: any) {
    console.error('Get courses conducted error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses conducted', details: error.message });
  }
});

// Create course conducted (trainer only)
router.post(
  '/:id/courses-conducted',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { courseId, courseName, dateConducted, location, participantsCount, notes } = req.body;

      if (!courseName || !dateConducted) {
        return res.status(400).json({ error: 'courseName and dateConducted are required' });
      }

      // Check for duplicate (same trainer, course, and date)
      const existing = await prisma.trainerCourseConducted.findFirst({
        where: {
          trainerId,
          courseId: courseId || null,
          dateConducted: new Date(dateConducted),
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'This course has already been recorded for this date' });
      }

      const courseConducted = await prisma.trainerCourseConducted.create({
        data: {
          trainerId,
          courseId: courseId || null,
          courseName,
          dateConducted: new Date(dateConducted),
          location: location || null,
          participantsCount: participantsCount ? parseInt(participantsCount) : null,
          notes: notes || null,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      // Log course conducted creation
      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'course_conducted',
        entityId: courseConducted.id,
        description: `Trainer added a course conducted record: ${courseConducted.courseName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(201).json({ courseConducted });
    } catch (error: any) {
      console.error('Create course conducted error:', error);
      return res.status(500).json({ error: 'Failed to create course conducted', details: error.message });
    }
  }
);

// Update course conducted (trainer only)
router.put(
  '/:id/courses-conducted/:conductedId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const conductedId = req.params.conductedId;

      const existing = await prisma.trainerCourseConducted.findUnique({
        where: { id: conductedId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Course conducted not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { courseName, dateConducted, location, participantsCount, notes } = req.body;

      const updateData: any = {};
      if (courseName !== undefined) updateData.courseName = courseName;
      if (dateConducted !== undefined) updateData.dateConducted = new Date(dateConducted);
      if (location !== undefined) updateData.location = location || null;
      if (participantsCount !== undefined) updateData.participantsCount = participantsCount ? parseInt(participantsCount) : null;
      if (notes !== undefined) updateData.notes = notes || null;

      const courseConducted = await prisma.trainerCourseConducted.update({
        where: { id: conductedId },
        data: updateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Log course conducted update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'course_conducted',
        entityId: courseConducted.id,
        description: `Trainer updated course conducted record: ${courseConducted.courseName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ courseConducted });
    } catch (error: any) {
      console.error('Update course conducted error:', error);
      return res.status(500).json({ error: 'Failed to update course conducted', details: error.message });
    }
  }
);

// Delete course conducted (trainer only)
router.delete(
  '/:id/courses-conducted/:conductedId',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const trainerId = req.params.id;
      const conductedId = req.params.conductedId;

      const existing = await prisma.trainerCourseConducted.findUnique({
        where: { id: conductedId },
      });

      if (!existing || existing.trainerId !== trainerId) {
        return res.status(404).json({ error: 'Course conducted not found' });
      }

      if (req.user!.role !== 'ADMIN' && req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.trainerCourseConducted.delete({
        where: { id: conductedId },
      });

      // Log course conducted deletion
      await createActivityLog({
        userId: trainerId,
        actionType: 'DELETE',
        entityType: 'course_conducted',
        entityId: conductedId,
        description: `Trainer deleted course conducted record: ${existing.courseName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ message: 'Course conducted deleted successfully' });
    } catch (error: any) {
      console.error('Delete course conducted error:', error);
      return res.status(500).json({ error: 'Failed to delete course conducted', details: error.message });
    }
  }
);

export default router;

