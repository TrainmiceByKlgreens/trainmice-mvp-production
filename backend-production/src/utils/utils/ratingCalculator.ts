import prisma from '../../config/database';

/**
 * Calculate average course rating from feedbacks
 * Based on course quality questions: qContentClarity, qObjectivesAchieved, 
 * qMaterialsHelpful, qEnvironmentLearning, qRecommendCourse
 * Includes feedbacks from both courses and events
 */
export async function calculateCourseRating(courseId: string): Promise<number | null> {
  // Get events for this course
  const events = await prisma.event.findMany({
    where: { courseId },
    select: { id: true },
  });
  const eventIds = events.map(e => e.id);

  const feedbacks = await prisma.feedback.findMany({
    where: {
      OR: [
        { courseId: courseId },
        { eventId: { in: eventIds } },
      ],
    },
    select: {
      contentClarity: true,
      objectivesAchieved: true,
      materialsHelpful: true,
      learningEnvironment: true,
      recommendCourse: true,
    },
  });

  if (feedbacks.length === 0) {
    return null;
  }

  let totalRating = 0;
  let totalCount = 0;

  feedbacks.forEach((feedback: { contentClarity: number | null; objectivesAchieved: number | null; materialsHelpful: number | null; learningEnvironment: number | null; recommendCourse: number | null }) => {
    const ratings = [
      feedback.contentClarity,
      feedback.objectivesAchieved,
      feedback.materialsHelpful,
      feedback.learningEnvironment,
      feedback.recommendCourse,
    ].filter((r): r is number => r !== null && r !== undefined);

    totalRating += ratings.reduce((sum, r) => sum + r, 0);
    totalCount += ratings.length;
  });

  if (totalCount === 0) {
    return null;
  }

  const average = totalRating / totalCount;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate average trainer rating from feedbacks
 * Based on trainer quality questions: qTrainerKnowledge, qEngagement,
 * qNewKnowledge, qApplicationUnderstanding
 */
export async function calculateTrainerRating(trainerId: string): Promise<number | null> {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      trainerId: trainerId,
    },
    select: {
      trainerKnowledge: true,
      trainerEngagement: true,
      knowledgeExposure: true,
      knowledgeApplication: true,
    },
  });

  if (feedbacks.length === 0) {
    return null;
  }

  let totalRating = 0;
  let totalCount = 0;

  feedbacks.forEach((feedback: { trainerKnowledge: number | null; trainerEngagement: number | null; knowledgeExposure: number | null; knowledgeApplication: number | null }) => {
    const ratings = [
      feedback.trainerKnowledge,
      feedback.trainerEngagement,
      feedback.knowledgeExposure,
      feedback.knowledgeApplication,
    ].filter((r): r is number => r !== null && r !== undefined);

    totalRating += ratings.reduce((sum, r) => sum + r, 0);
    totalCount += ratings.length;
  });

  if (totalCount === 0) {
    return null;
  }

  const average = totalRating / totalCount;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate ratings for multiple courses at once
 * Includes feedbacks from both courses and events
 */
export async function calculateCourseRatings(courseIds: string[]): Promise<Map<string, number | null>> {
  // Get events for these courses
  const events = await prisma.event.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, courseId: true },
  });
  const eventIds = events.map((e: { id: string }) => e.id);
  const eventToCourseMap = new Map(events.map((e: { id: string; courseId: string }) => [e.id, e.courseId]));

  const feedbacks = await prisma.feedback.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        { eventId: { in: eventIds } },
      ],
    },
    select: {
      courseId: true,
      eventId: true,
      contentClarity: true,
      objectivesAchieved: true,
      materialsHelpful: true,
      learningEnvironment: true,
      recommendCourse: true,
    },
  });

  const ratingsMap = new Map<string, { total: number; count: number }>();

  // Initialize map for all course IDs
  courseIds.forEach((id) => {
    ratingsMap.set(id, { total: 0, count: 0 });
  });

  // Calculate totals
  feedbacks.forEach((feedback: { courseId: string | null; eventId: string | null; contentClarity: number | null; objectivesAchieved: number | null; materialsHelpful: number | null; learningEnvironment: number | null; recommendCourse: number | null }) => {
    // Determine which course this feedback belongs to
    let targetCourseId: string | null = null;
    if (feedback.courseId) {
      targetCourseId = feedback.courseId;
    } else if (feedback.eventId && eventToCourseMap.has(feedback.eventId)) {
      const courseId = eventToCourseMap.get(feedback.eventId);
      if (courseId) {
        targetCourseId = courseId;
      }
    }
    
    if (!targetCourseId || !courseIds.includes(targetCourseId)) return;

    const ratings = [
      feedback.contentClarity,
      feedback.objectivesAchieved,
      feedback.materialsHelpful,
      feedback.learningEnvironment,
      feedback.recommendCourse,
    ].filter((r): r is number => r !== null && r !== undefined);

    const current = ratingsMap.get(targetCourseId) || { total: 0, count: 0 };
    current.total += ratings.reduce((sum, r) => sum + r, 0);
    current.count += ratings.length;
    ratingsMap.set(targetCourseId, current);
  });

  // Calculate averages
  const result = new Map<string, number | null>();
  ratingsMap.forEach((value, courseId) => {
    if (value.count === 0) {
      result.set(courseId, null);
    } else {
      const average = value.total / value.count;
      result.set(courseId, Math.round(average * 10) / 10);
    }
  });

  return result;
}

/**
 * Calculate ratings for multiple trainers at once
 */
export async function calculateTrainerRatings(trainerIds: string[]): Promise<Map<string, number | null>> {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      trainerId: { in: trainerIds },
    },
    select: {
      trainerId: true,
      trainerKnowledge: true,
      trainerEngagement: true,
      knowledgeExposure: true,
      knowledgeApplication: true,
    },
  });

  const ratingsMap = new Map<string, { total: number; count: number }>();

  // Initialize map for all trainer IDs
  trainerIds.forEach((id) => {
    ratingsMap.set(id, { total: 0, count: 0 });
  });

  // Calculate totals
  feedbacks.forEach((feedback: { trainerId: string | null; trainerKnowledge: number | null; trainerEngagement: number | null; knowledgeExposure: number | null; knowledgeApplication: number | null }) => {
    if (!feedback.trainerId) return;

    const ratings = [
      feedback.trainerKnowledge,
      feedback.trainerEngagement,
      feedback.knowledgeExposure,
      feedback.knowledgeApplication,
    ].filter((r): r is number => r !== null && r !== undefined);

    const current = ratingsMap.get(feedback.trainerId) || { total: 0, count: 0 };
    current.total += ratings.reduce((sum, r) => sum + r, 0);
    current.count += ratings.length;
    ratingsMap.set(feedback.trainerId, current);
  });

  // Calculate averages
  const result = new Map<string, number | null>();
  ratingsMap.forEach((value, trainerId) => {
    if (value.count === 0) {
      result.set(trainerId, null);
    } else {
      const average = value.total / value.count;
      result.set(trainerId, Math.round(average * 10) / 10);
    }
  });

  return result;
}

