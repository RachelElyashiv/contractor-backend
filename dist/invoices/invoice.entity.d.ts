import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { InvoiceItem } from './invoice-item.entity';
export declare enum InvoiceType {
    INVOICE = "invoice",
    QUOTE = "quote",
    RECEIPT = "receipt"
}
export declare enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare class Invoice {
    id: string;
    invoiceNumber: string;
    type: InvoiceType;
    status: InvoiceStatus;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    total: number;
    notes: string;
    issueDate: Date;
    dueDate: Date;
    paidDate: Date;
    project: Project;
    projectId: string;
    owner: User;
    ownerId: string;
    items: InvoiceItem[];
    createdAt: Date;
    updatedAt: Date;
}
