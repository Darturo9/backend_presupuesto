import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS usando la variable de entorno FRONTEND_URL
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Presupuesto API')
    .setDescription('Documentación de la API de Presupuesto')
    .setVersion('1.0')
    .addBearerAuth() // Para endpoints protegidos con JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      transform: true, // Transforma automáticamente los tipos
      forbidNonWhitelisted: true, // Arroja error si hay propiedades no definidas
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
