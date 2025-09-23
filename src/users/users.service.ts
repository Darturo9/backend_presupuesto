import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

}
