import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';

export async function evidenceRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // /api/evidence/upload
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No se envió ningún archivo' });
    }

    // El ID del progreso de la misión se debe pasar como form-data u otra parte de la request
    const { fields } = data;
    const missionProgressId = (fields.missionProgressId as any)?.value as string;

    if (!missionProgressId) {
      return reply.status(400).send({ error: 'missionProgressId es requerido' });
    }

    // Ruta segura para guardar la evidencia
    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${data.filename}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    await pipeline(data.file, fs.createWriteStream(filePath));

    // Enviar a S3 o similar en un entorno real.
    // Aquí actualizamos el estado en base de datos.
    const evidenceUrl = `/uploads/${uniqueFilename}`;

    // Actualizamos el progreso de la misión
    try {
      // Buscar un objetivo de tipo PHOTO que esté pendiente
      const objectiveProgress = await prisma.objectiveProgress.findFirst({
        where: {
          missionProgressId,
          isCompleted: false,
          objective: {
            type: 'PHOTO' // Buscar objetivo tipo foto
          }
        }
      });

      if (!objectiveProgress) {
         return reply.status(404).send({ error: 'No hay objetivos de fotografía pendientes para esta misión.' });
      }

      await prisma.objectiveProgress.update({
        where: { id: objectiveProgress.id },
        data: {
          isCompleted: true,
          evidenceUrl,
          completedAt: new Date()
        }
      });

      return { success: true, url: evidenceUrl, objectiveId: objectiveProgress.id };
    } catch (dbError) {
      fastify.log.error(dbError);
      return reply.status(500).send({ error: 'Error al registrar evidencia' });
    }
  });
}
