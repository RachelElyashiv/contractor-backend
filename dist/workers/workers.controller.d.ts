import { WorkersService } from './workers.service';
export declare class WorkersController {
    private workersService;
    constructor(workersService: WorkersService);
    findAll(req: any): Promise<import("./worker.entity").Worker[]>;
    getAttendanceToday(req: any): Promise<{
        todayAttendance: import("./attendance.entity").Attendance;
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
        attendances: import("./attendance.entity").Attendance[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMonthly(req: any, year: string, month: string): Promise<{
        worker: import("./worker.entity").Worker;
        totalHours: number;
        daysPresent: number;
        totalPay: number;
        attendances: import("./attendance.entity").Attendance[];
    }[]>;
    findOne(id: string, req: any): Promise<import("./worker.entity").Worker>;
    create(body: any, req: any): Promise<import("./worker.entity").Worker>;
    update(id: string, body: any, req: any): Promise<import("./worker.entity").Worker>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    markAttendance(id: string, body: any): Promise<import("./attendance.entity").Attendance>;
}
