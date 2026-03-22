import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import webpush from 'web-push'
import nodemailer from 'nodemailer'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
webpush.setVapidDetails('mailto:soporte@pythathon.com', VAPID_PUBLIC, VAPID_PRIVATE)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user', // Usar ethereal pass para pruebas locales
    pass: process.env.SMTP_PASS || 'ethereal.pass',
  },
})

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Endpoint para guardar la subscripción generada por el frontend
  fastify.post('/subscribe', async (request, reply) => {
    // @ts-ignore
    const user = request.user as { id: string }
    const subscription = request.body

    await prisma.user.update({
      where: { id: user.id },
      data: { pushSubString: JSON.stringify(subscription) }
    })

    return { success: true }
  })

  // Endpoint interno/admin para disparar alertas (Misión completada, Ganancia de javitos, etc)
  fastify.post('/trigger', async (request, reply) => {
    // @ts-ignore
    const caller = request.user as { id: string, role: string }
    // En producción limitariamos esto solo al backend interno o Admin
    const { userId, title, body } = request.body as { userId: string, title: string, body: string }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return reply.status(404).send({ error: 'Usuario no encontrado' })

    let pushSent = false

    // Intentamos Web Push si hay suscripción
    if (targetUser.pushSubString) {
      try {
        const sub = JSON.parse(targetUser.pushSubString)
        await webpush.sendNotification(sub, JSON.stringify({ title, body }))
        pushSent = true
      } catch (e) {
        fastify.log.error(e, 'Fallo el Push Notification, cayendo a Email...')
      }
    }

    // Fallback a Email si el Push falla o no está suscrito
    if (!pushSent) {
      try {
        await transporter.sendMail({
          from: '"Pythathon" <no-reply@pythathon.com>',
          to: targetUser.email,
          subject: title,
          text: body,
        })
      } catch (emailError) {
        fastify.log.error(emailError, 'Fallo también el Email Fallback')
        return reply.status(500).send({ error: 'Fallo al notificar al usuario por completo' })
      }
    }

    // Guardar notificación en la BD para el historial in-app
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title,
        body,
        type: 'SYSTEM',
        channel: pushSent ? 'PUSH' : 'EMAIL',
      }
    })

    return { success: true, method: pushSent ? 'PUSH' : 'EMAIL' }
  })
}
