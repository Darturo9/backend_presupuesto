import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Obtener información del contexto para personalizar el mensaje
    const path = request.url;
    let message = 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.';
    let details = '';

    // Personalizar mensaje según la ruta
    if (path.includes('/auth/login')) {
      message = 'Demasiados intentos de inicio de sesión.';
      details = 'Por seguridad, espera 1 minuto antes de intentar nuevamente.';
    } else if (path.includes('/transactions') && request.method === 'POST') {
      message = 'Has creado muchas transacciones muy rápido.';
      details = 'Espera un momento antes de crear otra transacción.';
    } else if (path.includes('/categories') && request.method === 'POST') {
      message = 'Has creado muchas categorías muy rápido.';
      details = 'Espera un momento antes de crear otra categoría.';
    } else if (request.method === 'DELETE') {
      message = 'Has eliminado varios elementos muy rápido.';
      details = 'Por seguridad, espera un momento antes de eliminar otro elemento.';
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}