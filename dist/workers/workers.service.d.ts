import { Repository } from 'typeorm';
import { Worker } from './worker.entity';
import { Attendance } from './attendance.entity';
export declare class WorkersService {
    private workerRepo;
    private attendanceRepo;
    constructor(workerRepo: Repository<Worker>, attendanceRepo: Repository<Attendance>);
    findAll(ownerId: string): Promise<Worker[]>;
    findOne(id: string, ownerId: string): Promise<Worker>;
    create(data: Partial<Worker>, ownerId: string): Promise<Worker>;
    update(id: string, data: Partial<Worker>, ownerId: string): Promise<Worker>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
    getAttendanceToday(ownerId: string): Promise<{
        todayAttendance: Attendance;
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        role: string;
        dailyRate: number;
        idNumber: string;
        avatarUrl: string;
        isActive: boolean;
        owner: import("../users/user.entity").User;
        ownerId: string;
        attendances: Attendance[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    markAttendance(workerId: string, data: Partial<Attendance>): Promise<Attendance>;
    getMonthlyReport(ownerId: string, year: number, month: number): Promise<{
        worker: Worker;
        totalHours: number;
        daysPresent: number;
        totalPay: number;
        attendances: Attendance[];
    }[]>;
}
