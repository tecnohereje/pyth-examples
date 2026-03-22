import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { checkRole } from '../../utils/rbac'

export async function merchantRoutes(fastify: FastifyInstance) {
  // Solo comerciantes
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
      await checkRole(['MERCHANT', 'ADMIN'])(request, reply) // Admins también pueden ver
    } catch (err) {
      reply.send(err)
    }
  })

  // Ver mis órdenes (donde soy el merchant del producto)
  fastify.get('/my-orders', async (request, reply) => {
    // @ts-ignore
    const { id: userId } = request.user as { id: string }
    
    const merchant = await prisma.merchant.findUnique({ where: { userId } })
    if (!merchant) return reply.status(403).send({ error: 'No eres un Merchant registrado' })

    const orders = await prisma.order.findMany({
      where: {
        product: { merchantId: merchant.id }
      },
      include: {
        product: true,
        user: { select: { email: true, displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders
  })

  // Ver mis productos
  fastify.get('/my-products', async (request, reply) => {
    // @ts-ignore
    const { id: userId } = request.user as { id: string }
    
    const merchant = await prisma.merchant.findUnique({ where: { userId } })
    if (!merchant) return reply.status(403).send({ error: 'No eres un Merchant registrado' })

    const products = await prisma.product.findMany({
      where: { merchantId: merchant.id }
    })

    return products
  })
}
