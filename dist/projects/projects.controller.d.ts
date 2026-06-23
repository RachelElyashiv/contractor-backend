import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
    getReport(id: string, ownerId: string, res: any): Promise<void>;
    findAll(req: any): Promise<import("./project.entity").Project[]>;
    getDashboard(req: any): Promise<{
        total: number;
        active: number;
        delayed: number;
        totalBudget: number;
        totalPaid: number;
        projects: import("./project.entity").Project[];
    }>;
    findOne(id: string, req: any): Promise<import("./project.entity").Project>;
    create(body: any, req: any): Promise<import("./project.entity").Project>;
    update(id: string, body: any, req: any): Promise<import("./project.entity").Project>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    getTasks(id: string, req: any): Promise<import("./task.entity").Task[]>;
    createTask(id: string, body: any, req: any): Promise<import("./task.entity").Task>;
    updateTask(taskId: string, body: any): Promise<import("./task.entity").Task>;
    removeTask(taskId: string): Promise<{
        message: string;
    }>;
}
