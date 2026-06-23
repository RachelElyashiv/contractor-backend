import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { Photo } from '../photos/photo.entity';
import { Expense } from '../expenses/expense.entity';
import { Invoice } from '../invoices/invoice.entity';
export declare enum ProjectStatus {
    ACTIVE = "active",
    PENDING = "pending",
    COMPLETED = "completed",
    DELAYED = "delayed",
    CANCELLED = "cancelled"
}
export declare class Project {
    id: string;
    name: string;
    description: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    address: string;
    city: string;
    budget: number;
    amountPaid: number;
    progressPercent: number;
    status: ProjectStatus;
    startDate: Date;
    endDate: Date;
    owner: User;
    ownerId: string;
    tasks: Task[];
    photos: Photo[];
    expenses: Expense[];
    invoices: Invoice[];
    createdAt: Date;
    updatedAt: Date;
}
