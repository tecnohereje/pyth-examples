import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID)

const googleLoginSchema = z.object({
  idToken: z.string(),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(fastify: FastifyInstance) {
  // Login con Google
  fastify.post('/google', async (request, reply) => {
    try {
      const { idToken } = googleLoginSchema.parse(request.body)
      
      const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return reply.status(400).send({ error: 'Token de Google inválido' })
      }

      const { email, name, picture, sub } = payload;
      
      // Buscar o crear usuario
      let user = await prisma.user.findUnique({ where: { email } })
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            displayName: name || 'Explorer',
            avatarUrl: picture,
            passwordHash: await bcrypt.hash(Math.random().toString(36), 10), // Pass aleatorio para usuarios de Google
            role: 'PLAYER'
          }
        })
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
      
      const { passwordHash: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword, token }
      
    } catch (error) {
      fastify.log.error(error)
      return reply.status(401).send({ error: 'Autenticación de Google fallida' })
    }
  })

  // Login de Invitado (para pruebas/explorer mode)
  fastify.post('/guest', async (request, reply) => {
    try {
      let user = await prisma.user.findUnique({ where: { email: 'guest@pythathon.com' } })
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'guest@pythathon.com',
            displayName: 'Pytathon Explorer',
            passwordHash: await bcrypt.hash('guest-password', 10),
            role: 'PLAYER'
          }
        })
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
      const { passwordHash: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword, token }
    } catch (error) {
      return reply.status(500).send({ error: 'Error al iniciar sesión como invitado' })
    }
  })

  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, displayName } = registerSchema.parse(request.body)
      
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return reply.status(400).send({ error: 'Email ya registrado' })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName,
          role: 'PLAYER'
        }
      })

      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
      
      // No devolvemos el password hash
      const { passwordHash: _, ...userWithoutPassword } = user
      
      return { user: userWithoutPassword, token }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.issues })
      }
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error del servidor' })
    }
  })

  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body)
      
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.status(401).send({ error: 'Credenciales inválidas' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({ error: 'Credenciales inválidas' })
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
      
      const { passwordHash: _, ...userWithoutPassword } = user
      
      return { user: userWithoutPassword, token }
    } catch (error) {
       if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos' })
      }
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error del servidor' })
    }
  })
}
