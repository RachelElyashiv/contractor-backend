import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, UseGuards, Request, Res, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    @Get(':id/report')
    async getReport(@Param('id') id: string, @Query('ownerId') ownerId: string, @Res() res: any) {
        const report = await this.projectsService.generateReport(id, ownerId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(report);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        return this.projectsService.findAll(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard')
    getDashboard(@Request() req) {
        return this.projectsService.getDashboardStats(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.projectsService.findOne(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() body: any, @Request() req) {
        return this.projectsService.create(body, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req) {
        return this.projectsService.update(id, body, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.projectsService.remove(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/tasks')
    getTasks(@Param('id') id: string, @Request() req) {
        return this.projectsService.getTasks(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/tasks')
    createTask(@Param('id') id: string, @Body() body: any, @Request() req) {
        return this.projectsService.createTask(id, body, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('tasks/:taskId')
    updateTask(@Param('taskId') taskId: string, @Body() body: any) {
        return this.projectsService.updateTask(taskId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('tasks/:taskId')
    removeTask(@Param('taskId') taskId: string) {
        return this.projectsService.removeTask(taskId);
    }
}