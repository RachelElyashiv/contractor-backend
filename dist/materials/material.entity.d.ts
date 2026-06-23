import { User } from '../users/user.entity';
export declare class Material {
    id: string;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    unitPrice: number;
    supplier: string;
    supplierPhone: string;
    imageUrl: string;
    projectId: string;
    category: string;
    deliveryStatus: string;
    deliveryNotes: string;
    deliveryImageUrl: string;
    owner: User;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
