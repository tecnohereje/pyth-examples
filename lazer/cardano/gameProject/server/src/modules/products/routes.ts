import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { z } from 'zod'

const createOrderSchema = z.object({
  productId: z.string(),
  applyDiscount: z.boolean(),
  priceAda: z.number(), // Enviado desde el frontend tras consultar a Pyth
  priceUsd: z.number(),
})

const confirmOrderSchema = z.object({
  txHash: z.string(),
})

export async function productRoutes(fastify: FastifyInstance) {
  // Autenticación mandatoria
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Listar productos activos
  fastify.get('/', async (request, reply) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        merchant: true
      }
    })
    return products
  })

  // Crear una orden (Estado inicial PENDING)
  fastify.post('/order', async (request, reply) => {
    // @ts-ignore
    const { id: userId } = request.user as { id: string }
    const { productId, applyDiscount, priceAda, priceUsd } = createOrderSchema.parse(request.body)

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { merchant: true }
      })

      if (!product) return reply.status(404).send({ error: 'Producto no encontrado' })

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' })

      let javitosUsed = 0
      let discountApplied = 0

      if (applyDiscount) {
        if (user.javitosBalance < product.javitosRequired) {
          return reply.status(400).send({ error: 'Javitos insuficientes para el descuento' })
        }
        javitosUsed = product.javitosRequired
        discountApplied = product.discountPercentage
      }

      const order = await prisma.order.create({
        data: {
          userId,
          productId,
          priceAdaAtPurchase: priceAda,
          priceUsdAtPurchase: priceUsd,
          javitosUsed,
          discountApplied,
          escrowStatus: 'PENDING',
        }
      })

      return { 
        orderId: order.id, 
        merchantWallet: product.merchant.walletAddress 
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error al crear la orden' })
    }
  })

  // Confirmar orden con Hash de transacción
  fastify.post('/order/:id/confirm', async (request, reply) => {
    const { id: orderId } = request.params as { id: string }
    const { txHash } = confirmOrderSchema.parse(request.body)
    // @ts-ignore
    const { id: userId } = request.user as { id: string }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      })

      if (!order || order.userId !== userId) {
        return reply.status(404).send({ error: 'Orden no encontrada' })
      }

      // Transacción: Actualizar orden y descontar Javitos si aplica
      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { 
            txHash, 
            escrowStatus: 'LOCKED' 
          }
        })

        if (order.javitosUsed > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { 
              javitosBalance: { decrement: order.javitosUsed } 
            }
          })
        }

        return updatedOrder
      })

      return { status: 'success', order: result }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error al confirmar la orden' })
    }
  })
}
