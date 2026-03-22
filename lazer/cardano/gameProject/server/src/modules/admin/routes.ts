import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { checkRole } from '../../utils/rbac'

export async function adminRoutes(fastify: FastifyInstance) {
  // Solo administradores
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
      await checkRole(['ADMIN'])(request, reply)
    } catch (err) {
      reply.send(err)
    }
  })

  // Estadísticas globales
  fastify.get('/stats', async () => {
    const [userCount, missionCount, orderCount, totalAda] = await Promise.all([
      prisma.user.count(),
      prisma.mission.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { priceAdaAtPurchase: true }
      })
    ])

    return {
      users: userCount,
      missions: missionCount,
      orders: orderCount,
      revenueAda: totalAda._sum.priceAdaAtPurchase || 0
    }
  })

  // Lista de usuarios con balances
  fastify.get('/users', async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        javitosBalance: true,
        walletAddress: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return users
  })
}
