/**
 * Event Sync Utility
 * Automatically creates/updates events when courses have fixedDate
 * Simple approach: keep both course and event records in sync
 */

import prisma from '../../config/database';

/**
 * Create or update event for a course with fixedDate
 * Called whenever a course is created or updated with fixedDate
 */
export async function syncEventFromCourse(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      courseTrainers: {
        select: {
          trainerId: true,
        },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Only create/update event if course has fixedDate
  if (!course.fixedDate) {
    // If fixedDate is removed, we can optionally delete the event
    // For now, we'll keep the event (it's already happened)
    return null;
  }

  // For admin-created courses, use the first assigned trainer from CourseTrainer table
  // Otherwise use course.trainerId
  let trainerId = course.trainerId;
  if (!trainerId && course.courseTrainers && course.courseTrainers.length > 0) {
    trainerId = course.courseTrainers[0].trainerId;
  }

  // Check if event already exists
  const existingEvent = await prisma.event.findFirst({
    where: {
      courseId: course.id,
      eventDate: course.fixedDate,
    },
  });

  const eventData = {
    courseId: course.id,
    trainerId: trainerId,
    createdBy: course.createdBy,
    title: course.title,
    description: course.description,
    learningObjectives: course.learningObjectives ?? undefined,
    learningOutcomes: course.learningOutcomes ?? undefined,
    targetAudience: course.targetAudience,
    methodology: course.methodology,
    prerequisite: course.prerequisite,
    certificate: course.certificate,
    assessment: course.assessment,
    courseType: course.courseType ?? undefined,
    durationHours: course.durationHours,
    durationUnit: course.durationUnit,
    modules: course.modules ?? undefined,
    venue: course.venue,
    price: course.price,
    eventDate: course.fixedDate,
    startDate: course.startDate,
    endDate: course.endDate,
    category: course.category,
    city: course.city,
    state: course.state,
    hrdcClaimable: course.hrdcClaimable,
    brochureUrl: course.brochureUrl,
    courseSequence: course.courseSequence,
    status: 'ACTIVE' as const, // Events always start as ACTIVE, regardless of course status
    maxPacks: null, // Can be set later by admin
  };

  if (existingEvent) {
    // Update existing event
    const updated = await prisma.event.update({
      where: { id: existingEvent.id },
      data: eventData as any,
    });
    console.log(`Event updated for course ${courseId}:`, updated.id);
    return updated;
  } else {
    // Create new event
    const created = await prisma.event.create({
      data: eventData as any,
    });
    console.log(`Event created for course ${courseId}:`, created.id);
    return created;
  }
}

