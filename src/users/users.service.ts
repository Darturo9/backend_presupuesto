import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSettings } from './entities/user-settings.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
  ) { }


  async create(createUserDto: CreateUserDto) {
    // Verifica que el email no exista
    const exists = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    // Hashea la contraseña si viene en el DTO
    let passwordHash: string | undefined = undefined;
    if (createUserDto.password) {
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: passwordHash,
    });

    // Guarda el usuario
    const savedUser = await this.usersRepository.save(user);

    // No devuelvas la contraseña
    const { password, ...result } = savedUser;
    return result;
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    // No devuelvas la contraseña
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    // Si se quiere actualizar la contraseña y el usuario NO es de Google
    if (updateUserDto.password) {
      if (user.googleId) {
        throw new Error('No puedes cambiar la contraseña de una cuenta de Google');
      }
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      // No actualizar la contraseña si no se envía
      delete updateUserDto.password;
    }

    // Actualiza los campos permitidos
    this.usersRepository.merge(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    // No devuelvas la contraseña
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    // Soft delete: marcar como inactivo
    user.isActive = false;
    await this.usersRepository.save(user);

    return { message: `Usuario con id ${id} desactivado correctamente` };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateGoogleId(userId: number, googleId: string) {
    return this.usersRepository.save({
      id: userId,
      googleId,
    });
  }

  async getUserSettings(userId: number): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });

    if (!settings) {
      // Crear configuración por defecto si no existe
      settings = this.userSettingsRepository.create({
        userId,
        currency: 'GTQ',
        dateFormat: 'DD/MM/YYYY',
        language: 'es',
        budgetAlerts: true,
        transactionReminders: false,
        weeklyReports: true,
      });
      settings = await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateUserSettings(userId: number, updateUserSettingsDto: UpdateUserSettingsDto): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });

    if (!settings) {
      // Crear configuración si no existe
      settings = this.userSettingsRepository.create({
        userId,
        ...updateUserSettingsDto,
      });
    } else {
      // Actualizar configuración existente
      this.userSettingsRepository.merge(settings, updateUserSettingsDto);
    }

    return this.userSettingsRepository.save(settings);
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    // Obtener el usuario
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    // Verificar si es un usuario de Google
    if (user.googleId) {
      throw new Error('No puedes cambiar la contraseña de una cuenta vinculada con Google');
    }

    // Verificar si el usuario tiene contraseña
    if (!user.password) {
      throw new Error('Esta cuenta no tiene contraseña configurada');
    }

    // Validar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('La nueva contraseña debe ser diferente a la actual');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await this.usersRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async deleteAccount(userId: number, deleteAccountDto: DeleteAccountDto): Promise<{ message: string }> {
    const { password, confirmation } = deleteAccountDto;

    // Validar confirmación
    if (confirmation !== 'ELIMINAR') {
      throw new Error('Debes escribir "ELIMINAR" para confirmar la eliminación de tu cuenta');
    }

    // Obtener el usuario
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    // Si el usuario tiene contraseña local, validarla
    if (user.password && !user.googleId) {
      if (!password) {
        throw new Error('Debes ingresar tu contraseña para eliminar la cuenta');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
      }
    }

    // Eliminar configuraciones del usuario
    await this.userSettingsRepository.delete({ userId });

    // Soft delete: marcar como inactivo en lugar de eliminar completamente
    // Esto preserva la integridad referencial con transacciones, categorías, etc.
    await this.usersRepository.update(userId, {
      isActive: false,
      email: `deleted_${userId}_${user.email}`, // Modificar email para permitir re-registro
      googleId: user.googleId ? `deleted_${userId}_${user.googleId}` : undefined
    });

    return { message: 'Cuenta eliminada correctamente' };
  }

}
