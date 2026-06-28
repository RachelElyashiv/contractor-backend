import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkersService } from './workers.service';

@Controller('workers')
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Get()
  findAll(@Request() req) {
    return this.workersService.findAll(req.user.id);
  }

  @Get('attendance/today')
  getAttendanceToday(
    @Request() req,
    @Query('projectId') projectId?: string,
    @Query('apartmentId') apartmentId?: string,
  ) {
    return this.workersService.getAttendanceToday(req.user.id, projectId, apartmentId);
  }

  @Get('attendance/monthly')
  getMonthly(@Request() req, @Query('year') year: string, @Query('month') month: string) {
    return this.workersService.getMonthlyReport(
      req.user.id,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.workersService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.workersService.create(body, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.workersService.update(id, body, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.workersService.remove(id, req.user.id);
  }

  @Post(':id/attendance')
  markAttendance(@Param('id') id: string, @Body() body: any) {
    return this.workersService.markAttendance(id, body);
  }
}
