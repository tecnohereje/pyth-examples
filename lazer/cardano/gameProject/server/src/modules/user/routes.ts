import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'

export async function userRoutes(fastify: FastifyInstance) {
  // Middleware de autenticación para todas las rutas de usuario
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Obtener perfil del usuario actual (me)
  fastify.get('/me', async (request, reply) => {
    try {
      // @ts-ignore
      const { id } = request.user as { id: string }
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          javitosBalance: true,
          walletAddress: true,
          role: true,
          createdAt: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Usuario no encontrado' })
      }

      return { user }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error del servidor' })
    }
  })

  // Actualizar perfil (ej. walletAddress)
  fastify.patch('/me', async (request, reply) => {
    try {
      // @ts-ignore
      const { id } = request.user as { id: string }
      const body = request.body as any
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          displayName: body.displayName,
          walletAddress: body.walletAddress,
          avatarUrl: body.avatarUrl
        }
      })

      return { user: updatedUser }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error al actualizar perfil' })
    }
  })
}
