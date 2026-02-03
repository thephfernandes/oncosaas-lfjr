import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(
    email: string,
    password: string,
    tenantId?: string
  ): Promise<any> {
    // Buscar usuário usando tenantId e email (índice composto @@unique([tenantId, email]))
    // Se não tiver tenantId, buscar por email (pode haver múltiplos usuários com mesmo email em tenants diferentes)
    const where = tenantId
      ? {
          tenantId,
          email,
        }
      : { email }; // Fallback se não tiver tenantId

    const user = await this.prisma.user.findFirst({
      where,
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, tenantId?: string) {
    const user = await this.validateUser(
      loginDto.email,
      loginDto.password,
      tenantId
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Verificar se tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: registerDto.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    // Verificar se email já existe no tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId: registerDto.tenantId,
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: registerDto.role,
        tenantId: registerDto.tenantId,
      },
      include: { tenant: true },
    });

    const { password: _, ...result } = user;

    return {
      message: 'User created successfully',
      user: result,
    };
  }
}
