import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import multipart from '@fastify/multipart'

import { prisma } from './utils/prisma'
import { authRoutes } from './modules/auth/routes'
import { userRoutes } from './modules/user/routes'
import { missionRoutes } from './modules/missions/routes'
import { evidenceRoutes } from './modules/missions/evidenceRoutes'
import { notificationRoutes } from './modules/notifications/routes'
import { productRoutes } from './modules/products/routes'
import { adminRoutes } from './modules/admin/routes'
import { merchantRoutes } from './modules/merchant/routes'

const app = fastify({ logger: true })

// Plugins
app.register(cors, { origin: '*' }) 
app.register(jwt, { secret: process.env.JWT_SECRET || 'super-secret-pythathon' })
app.register(websocket)
app.register(multipart)

// DB connection hook
app.addHook('onClose', async (instance) => {
  await prisma.$disconnect()
})

// Check Route
app.get('/health', async (request, reply) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() }
  } catch (error) {
    reply.status(500)
    return { status: 'error', db: 'disconnected', error: String(error) }
  }
})

// Register Routes
app.register(authRoutes, { prefix: '/api/auth' })
app.register(userRoutes, { prefix: '/api/user' })
app.register(missionRoutes, { prefix: '/api/missions' })
app.register(evidenceRoutes, { prefix: '/api/evidence' })
app.register(notificationRoutes, { prefix: '/api/notifications' })
app.register(productRoutes, { prefix: '/api/products' })
app.register(adminRoutes, { prefix: '/api/admin' })
app.register(merchantRoutes, { prefix: '/api/merchant' })

// Run server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10)
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Server listening on ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
