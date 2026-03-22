import { FastifyReply, FastifyRequest } from 'fastify'

export const checkRole = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const user = request.user as { role: string }
    
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ 
        error: 'Acceso denegado', 
        message: 'No tienes permisos suficientes para realizar esta acción.' 
      })
    }
  }
}
