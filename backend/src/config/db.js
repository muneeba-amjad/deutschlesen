import { PrismaClient } from '@prisma/client'

// Reuse the same Prisma instance across the app
const prisma = new PrismaClient()

export default prisma
