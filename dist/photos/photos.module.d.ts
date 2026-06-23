import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Repository } from 'typeorm';
export declare class Photo {
    id: string;
    filename: string;
    url: string;
    caption: string;
    projectId: string;
    project: Project;
    owner: User;
    ownerId: string;
    takenAt: Date;
    createdAt: Date;
}
export declare class PhotosService {
    private repo;
    constructor(repo: Repository<Photo>);
    findAll(ownerId: string, projectId?: string): Promise<Photo[]>;
    savePhotos(files: Express.Multer.File[], ownerId: string, projectId?: string, caption?: string): Promise<Photo[]>;
    remove(id: string, ownerId: string): Promise<{
        message: string;
    }>;
}
export declare class PhotosController {
    private photosService;
    constructor(photosService: PhotosService);
    findAll(req: any, projectId?: string): Promise<Photo[]>;
    uploadPhotos(files: Express.Multer.File[], req: any, projectId?: string, caption?: string): Promise<Photo[]>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
export declare class PhotosModule {
}
