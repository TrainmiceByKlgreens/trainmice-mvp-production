const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const unreadCourses = await prisma.course.count({ where: { isRead: false } });
    const unreadAdminNotes = await prisma.adminCourseNote.count({ where: { isRead: false } });
    const unreadTrainerNotes = await prisma.courseNote.count({ where: { isRead: false } });
    const unreadMessages = await prisma.message.count({ where: { isRead: false } });

    console.log('Unread Counts:');
    console.log(`- Courses: ${unreadCourses}`);
    console.log(`- Admin Notes (To Trainer): ${unreadAdminNotes}`);
    console.log(`- Course Notes (To Admin): ${unreadTrainerNotes}`);
    console.log(`- Messages: ${unreadMessages}`);

    // Check course status distribution for unread courses
    const statuses = await prisma.course.groupBy({
        by: ['status'],
        where: { isRead: false },
        _count: true
    });
    console.log('\nUnread Course Statuses:', statuses);

  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
