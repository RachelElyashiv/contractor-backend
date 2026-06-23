import { Project } from './project.entity';
export declare class Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    assignedTo: string;
    dueDate: Date;
    sortOrder: number;
    project: Project;
    projectId: string;
    createdAt: Date;
}
