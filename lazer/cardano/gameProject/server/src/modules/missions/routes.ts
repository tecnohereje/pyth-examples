import crypto from 'crypto'
import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { z } from 'zod'
import { checkRole } from '../../utils/rbac'

const createMissionSchema = z.object({
  titleEs: z.string(),
  titleEn: z.string(),
  descriptionEs: z.string(),
  descriptionEn: z.string(),
  type: z.string(),
  javitosReward: z.number().int().positive(),
  timeLimitMinutes: z.number().int().optional(),
  cooldownMinutes: z.number().int().optional(),
  isGroup: z.boolean().default(false),
  maxParticipants: z.number().int().optional(),
})

// Helper: Calcular distancia en metros (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

// @ts-ignore
const QR_SECRET = process.env.QR_SECRET || 'fallback_secret'

export async function missionRoutes(fastify: FastifyInstance) {
  // Configurar requerimiento de autenticación para estas rutas
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Obtener misiones (y el estado de progreso del usuario actual)
  fastify.get('/', async (request, reply) => {
    // @ts-ignore
    const { id: userId } = request.user as { id: string }

    const missions = await prisma.mission.findMany({
      where: { status: 'ACTIVE' },
      include: {
        objectives: {
          include: {
            location: true
          }
        }
      }
    })

    const userProgress = await prisma.missionProgress.findMany({
      where: { userId },
      include: {
        objectives: true
      }
    })

    return { missions, userProgress }
  })

  // Aceptar una misión
  fastify.post('/:id/accept', async (request, reply) => {
    const { id: missionId } = request.params as { id: string }
    // @ts-ignore
    const { id: userId } = request.user as { id: string }

    try {
      const existing = await prisma.missionProgress.findFirst({
        where: { userId, missionId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } }
      })

      if (existing) {
        return reply.status(400).send({ error: 'Misión ya en curso' })
      }

      const progress = await prisma.missionProgress.create({
        data: {
          userId,
          missionId,
          status: 'ACCEPTED'
        }
      })

      return { progress }
    } catch (error) {
      return reply.status(500).send({ error: 'Error al aceptar misión' })
    }
  })

  // Completar una misión (Validación de QR + GPS)
  fastify.post('/:id/complete', async (request, reply) => {
    const { id: missionId } = request.params as { id: string }
    // @ts-ignore
    const { id: userId } = request.user as { id: string }
    const { qrCode, lat, lng } = request.body as { qrCode: string, lat?: number, lng?: number }

    try {
      // 1. VALIDACIÓN DE FIRMA HMAC
      const hmac = crypto.createHmac('sha256', QR_SECRET).update(missionId).digest('hex').substring(0, 10)
      const expectedQr = `pythathon-mission-${missionId}-${hmac}`

      if (qrCode !== expectedQr) {
        return reply.status(400).send({ error: 'Código QR inválido o falsificado' })
      }

      // 2. BUSCAR MISIÓN Y PROGRESO
      const mission = await prisma.mission.findUnique({ 
        where: { id: missionId },
        include: { objectives: { include: { location: true } } }
      })
      if (!mission) return reply.status(404).send({ error: 'Misión no encontrada' })

      const progress = await prisma.missionProgress.findFirst({
        where: { userId, missionId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } }
      })
      if (!progress) return reply.status(400).send({ error: 'No tienes esta misión activa' })

      // 3. VALIDACIÓN GEOSPATIAL (GEOFENCING)
      const geoObjective = mission.objectives.find(o => o.type === 'GEOLOCATION' || o.locationId)
      
      if (geoObjective && geoObjective.location) {
        if (!lat || !lng) {
          return reply.status(400).send({ error: 'Esta misión requiere coordenadas GPS para validar tu posición' })
        }

        const distance = getDistance(lat, lng, geoObjective.location.latitude, geoObjective.location.longitude)
        const radius = geoObjective.location.radiusMeters || 100

        if (distance > radius) {
          return reply.status(400).send({ 
            error: 'Estás demasiado lejos del objetivo', 
            distance: Math.round(distance),
            requiredRadius: radius 
          })
        }
      }

      // 4. TRANSACCIÓN: ÉXITO
      const result = await prisma.$transaction([
        prisma.missionProgress.update({
          where: { id: progress.id },
          data: { status: 'COMPLETED', completedAt: new Date() }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { javitosBalance: { increment: mission.javitosReward } }
        })
      ])

      return { 
        status: 'success', 
        reward: mission.javitosReward, 
        newBalance: result[1].javitosBalance,
        message: '¡Misión completada con éxito y recompensas acreditadas!'
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error al procesar completitud de misión' })
    }
  })

  // Crear nueva misión (solo Admin)
  fastify.post('/', {
    preHandler: [checkRole(['ADMIN'])]
  }, async (request, reply) => {
    try {
      // @ts-ignore
      const user = request.user as { id: string }
      const data = createMissionSchema.parse(request.body)
      const mission = await prisma.mission.create({
        data: {
          ...data,
          status: 'ACTIVE',
          createdBy: user.id
        }
      })
      
      return { mission }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.issues })
      }
      return reply.status(500).send({ error: 'Error del servidor' })
    }
  })
}
