import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; fullName: string; companyName?: string; phone?: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('אימייל כבר קיים במערכת');

    const user = await this.usersService.create(data);
    const { password, ...result } = user;
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user: result, token };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('אימייל או סיסמה שגויים');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('אימייל או סיסמה שגויים');

    const { password: _, ...result } = user;
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user: result, token };
  }
}
