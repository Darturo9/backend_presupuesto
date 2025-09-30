import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from '../services/cloudinary.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
  }))
  async uploadAvatar(@Request() req, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('No se ha subido ningún archivo');
    }

    try {
      // Subir imagen a Cloudinary
      const avatarUrl = await this.cloudinaryService.uploadImage(file, req.user.id);

      // Actualizar el avatar del usuario en la base de datos
      const updatedUser = await this.usersService.update(req.user.id, { avatar: avatarUrl });

      return {
        message: 'Avatar actualizado correctamente',
        avatarUrl,
        user: updatedUser
      };
    } catch (error) {
      throw new Error(`Error al subir el avatar: ${error.message}`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/settings')
  getUserSettings(@Request() req) {
    return this.usersService.getUserSettings(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/settings')
  updateUserSettings(@Request() req, @Body() updateUserSettingsDto: UpdateUserSettingsDto) {
    return this.usersService.updateUserSettings(req.user.id, updateUserSettingsDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  deleteAccount(@Request() req, @Body() deleteAccountDto: DeleteAccountDto) {
    return this.usersService.deleteAccount(req.user.id, deleteAccountDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }


}
