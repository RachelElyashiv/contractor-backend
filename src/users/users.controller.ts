import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req) {
    const { password, ...user } = req.user;
    return user;
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.id, body);
  }
}
