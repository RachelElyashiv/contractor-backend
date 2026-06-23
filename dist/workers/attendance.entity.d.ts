import { Worker } from './worker.entity';
export declare class Attendance {
    id: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    hoursWorked: number;
    projectId: string;
    notes: string;
    status: string;
    worker: Worker;
    workerId: string;
    createdAt: Date;
}
