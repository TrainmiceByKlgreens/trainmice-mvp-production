import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Category Rename Script ---')
    console.log('Target: "Soft Skills & Specialised Training" -> "IT & Software"')
    console.log('------------------------------')

    const oldName = 'Soft Skills & Specialised Training'
    const newName = 'IT & Software'

    // Update Courses
    const courses = await prisma.course.findMany({
        where: {
            category: {
                not: null
            }
        }
    })

    let courseUpdateCount = 0
    for (const course of courses) {
        if (Array.isArray(course.category)) {
            const categories = course.category as string[]
            if (categories.includes(oldName)) {
                const updatedCategories = categories.map(cat => cat === oldName ? newName : cat)
                await prisma.course.update({
                    where: { id: course.id },
                    data: { category: updatedCategories }
                })
                courseUpdateCount++
            }
        }
    }

    // Update Events
    const events = await prisma.event.findMany({
        where: {
            category: {
                not: null
            }
        }
    })

    let eventUpdateCount = 0
    for (const event of events) {
        if (Array.isArray(event.category)) {
            const categories = event.category as string[]
            if (categories.includes(oldName)) {
                const updatedCategories = categories.map(cat => cat === oldName ? newName : cat)
                await prisma.event.update({
                    where: { id: event.id },
                    data: { category: updatedCategories }
                })
                eventUpdateCount++
            }
        }
    }

    console.log(`Success: Updated ${courseUpdateCount} courses and ${eventUpdateCount} events.`)
}

main()
    .catch(e => {
        console.error('Error during update:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
