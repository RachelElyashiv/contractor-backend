import { Material } from './material.entity';
import { Repository } from 'typeorm';
export declare class MaterialsService {
    private repo;
    constructor(repo: Repository<Material>);
    findAll(ownerId: string): Promise<Material[]>;
    findByProject(projectId: string, ownerId: string): Promise<Material[]>;
    findOne(id: string, ownerId: string): Promise<Material>;
    create(data: Partial<Material>, ownerId: string): Promise<Material>;
    update(id: string, data: Partial<Material>, ownerId: string): Promise<Material>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
    getLowStock(ownerId: string): Promise<Material[]>;
    adjustQuantity(id: string, ownerId: string, delta: number): Promise<Material>;
    updateDeliveryStatus(id: string, ownerId: string, status: string, notes?: string, imageUrl?: string): Promise<Material>;
}
export declare class MaterialsController {
    private materialsService;
    constructor(materialsService: MaterialsService);
    findAll(req: any, projectId?: string): Promise<Material[]>;
    getLowStock(req: any): Promise<Material[]>;
    findOne(id: string, req: any): Promise<Material>;
    create(body: any, req: any): Promise<Material>;
    update(id: string, body: any, req: any): Promise<Material>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    adjust(id: string, body: {
        delta: number;
    }, req: any): Promise<Material>;
    updateDelivery(id: string, body: {
        status: string;
        notes?: string;
        imageUrl?: string;
    }, req: any): Promise<Material>;
}
export declare class MaterialsModule {
}
