import { Invoice } from './invoice.entity';
import { Repository } from 'typeorm';
export declare class InvoicesService {
    private repo;
    constructor(repo: Repository<Invoice>);
    findAll(ownerId: string): Promise<Invoice[]>;
    findOne(id: string, ownerId: string): Promise<Invoice>;
    create(data: any, ownerId: string): Promise<Invoice[]>;
    update(id: string, data: Partial<Invoice>, ownerId: string): Promise<Invoice>;
    markPaid(id: string, ownerId: string): Promise<Invoice>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
    getSummary(ownerId: string): Promise<{
        totalRevenue: number;
        pendingAmount: number;
        overdueAmount: number;
        counts: {
            total: number;
            paid: number;
            pending: number;
            overdue: number;
        };
    }>;
}
export declare class InvoicesController {
    private invoicesService;
    constructor(invoicesService: InvoicesService);
    findAll(req: any): Promise<Invoice[]>;
    getSummary(req: any): Promise<{
        totalRevenue: number;
        pendingAmount: number;
        overdueAmount: number;
        counts: {
            total: number;
            paid: number;
            pending: number;
            overdue: number;
        };
    }>;
    findOne(id: string, req: any): Promise<Invoice>;
    create(body: any, req: any): Promise<Invoice[]>;
    update(id: string, body: any, req: any): Promise<Invoice>;
    markPaid(id: string, req: any): Promise<Invoice>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
export declare class InvoicesModule {
}
