import { Project } from '../projects/project.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
    companyName: string;
    avatarUrl: string;
    projects: Project[];
    createdAt: Date;
    updatedAt: Date;
}
