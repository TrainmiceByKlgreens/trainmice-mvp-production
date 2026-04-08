import prisma from '../../config/database';

/**
 * Generates the next sequential trainer ID (TR0001, TR0002, etc.)
 */
export async function generateTrainerId(): Promise<string> {
  // Find the highest existing trainer ID
  const lastTrainer = await prisma.trainer.findFirst({
    where: {
      customTrainerId: {
        not: null,
      },
    },
    orderBy: {
      customTrainerId: 'desc',
    },
  });

  let nextNumber = 1;

  if (lastTrainer?.customTrainerId) {
    // Extract the number from the last ID (e.g., "TR001" -> 1)
    const match = lastTrainer.customTrainerId.match(/TR(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as TR#### with zero padding (e.g., TR0001, TR0002, ..., TR9999)
  return `TR${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Generates the next sequential admin code (A001, A002, etc.)
 */
export async function generateAdminCode(): Promise<string> {
  // Find the highest existing admin code
  const lastAdmin = await prisma.admin.findFirst({
    where: {
      adminCode: {
        not: null,
      },
    },
    orderBy: {
      adminCode: 'desc',
    },
  });

  let nextNumber = 1;

  if (lastAdmin?.adminCode) {
    // Extract the number from the last code (e.g., "A001" -> 1)
    const match = lastAdmin.adminCode.match(/A(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as A### with zero padding (e.g., A001, A002, ..., A999)
  return `A${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Generates the next sequential course code for a creator
 * Format: <creatorCode>C1, <creatorCode>C2, etc.
 * @param creatorCode - The trainer ID (TR###) or admin code (A###)
 */
export async function generateCourseCode(creatorCode: string): Promise<string> {
  // Find the highest existing course code for this creator
  const lastCourse = await prisma.course.findFirst({
    where: {
      courseCode: {
        startsWith: creatorCode + 'C',
      },
    },
    orderBy: {
      courseCode: 'desc',
    },
  });

  let nextNumber = 1;

  if (lastCourse?.courseCode) {
    // Extract the number from the last code (e.g., "TR001C2" -> 2)
    const match = lastCourse.courseCode.match(new RegExp(`${creatorCode}C(\\d+)`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as <creatorCode>C# (e.g., TR001C1, TR001C2, A001C1, etc.)
  return `${creatorCode}C${nextNumber}`;
}

