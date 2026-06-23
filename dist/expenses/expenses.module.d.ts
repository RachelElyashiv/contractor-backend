import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
export declare class Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    projectId: string;
    receiptUrl: string;
    supplier: string;
    date: Date;
    notes: string;
    owner: User;
    ownerId: string;
    createdAt: Date;
}
export declare class ExpensesService {
    private repo;
    constructor(repo: Repository<Expense>);
    findAll(ownerId: string, projectId?: string): Promise<Expense[]>;
    findOne(id: string, ownerId: string): Promise<Expense>;
    create(data: Partial<Expense>, ownerId: string): Promise<Expense>;
    update(id: string, data: Partial<Expense>, ownerId: string): Promise<Expense>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
    getMonthlySummary(ownerId: string): Promise<{
        total: number;
        byCategory: any;
        count: number;
    }>;
}
export declare class ExpensesController {
    private expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any, projectId?: string): Promise<Expense[]>;
    getSummary(req: any): Promise<{
        total: number;
        byCategory: any;
        count: number;
    }>;
    findOne(id: string, req: any): Promise<Expense>;
    create(body: any, req: any): Promise<Expense>;
    update(id: string, body: any, req: any): Promise<Expense>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
export declare class ExpensesModule {
}
