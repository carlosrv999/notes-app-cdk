import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: `postgresql://${process.env.username}:${process.env.password}@${process.env.host}:${process.env.port}/${process.env.dbname}?schema=public`
    },
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
