import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(@Res() res: Response) {
    const data = this.appService.getHello()
    return res.status(201).json({ mensaje: data })
  }
}
