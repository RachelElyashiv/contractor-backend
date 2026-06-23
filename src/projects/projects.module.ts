import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Photo } from '../photos/photo.entity';
import { Material } from '../materials/material.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Project, Task, Photo, Material])],
    providers: [ProjectsService],
    controllers: [ProjectsController],
    exports: [ProjectsService],
})
export class ProjectsModule { }