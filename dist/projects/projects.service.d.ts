import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Photo } from '../photos/photo.entity';
import { Material } from '../materials/material.entity';
export declare class ProjectsService {
    private projectRepo;
    private taskRepo;
    private photoRepo;
    private materialRepo;
    constructor(projectRepo: Repository<Project>, taskRepo: Repository<Task>, photoRepo: Repository<Photo>, materialRepo: Repository<Material>);
    findAll(ownerId: string): Promise<Project[]>;
    findOne(id: string, ownerId: string): Promise<Project>;
    create(data: Partial<Project>, ownerId: string): Promise<Project>;
    update(id: string, data: Partial<Project>, ownerId: string): Promise<Project>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
    getTasks(projectId: string, ownerId: string): Promise<Task[]>;
    createTask(projectId: string, data: Partial<Task>, ownerId: string): Promise<Task>;
    updateTask(taskId: string, data: Partial<Task>): Promise<Task>;
    removeTask(taskId: string): Promise<{
        message: string;
    }>;
    getDashboardStats(ownerId: string): Promise<{
        total: number;
        active: number;
        delayed: number;
        totalBudget: number;
        totalPaid: number;
        projects: Project[];
    }>;
    generateReport(projectId: string, ownerId: string): Promise<string>;
}
