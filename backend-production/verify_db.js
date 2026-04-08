const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const languages = await prisma.trainerLanguage.findMany();
        console.log('Successfully reached trainerLanguage table. Count:', languages.length);
    } catch (error) {
        console.error('Error reaching trainerLanguage table:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
