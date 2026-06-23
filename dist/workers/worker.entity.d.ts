import { User } from '../users/user.entity';
import { Attendance } from './attendance.entity';
export declare class Worker {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    dailyRate: number;
    idNumber: string;
    avatarUrl: string;
    isActive: boolean;
    owner: User;
    ownerId: string;
    attendances: Attendance[];
    get fullName(): string;
    createdAt: Date;
    updatedAt: Date;
}
