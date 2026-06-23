import { Invoice } from './invoice.entity';
export declare class InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    invoice: Invoice;
    invoiceId: string;
}
