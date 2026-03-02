import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Corrected Category Rename Script ---')
    console.log('Target 1: "Software & Apps" -> "IT & Software"')
    console.log('Target 2: "Soft Skills & Specialised Training" -> "Soft Skills"')
    console.log('----------------------------------------')

    const renameMap: Record<string, string> = {
        'Software & Apps': 'IT & Software',
        'Soft Skills & Specialised Training': 'Soft Skills'
    }

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
            let hasChanges = false
            const updatedCategories = categories.map(cat => {
                if (renameMap[cat]) {
                    hasChanges = true
                    return renameMap[cat]
                }
                return cat
            })

            if (hasChanges) {
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
            let hasChanges = false
            const updatedCategories = categories.map(cat => {
                if (renameMap[cat]) {
                    hasChanges = true
                    return renameMap[cat]
                }
                return cat
            })

            if (hasChanges) {
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
