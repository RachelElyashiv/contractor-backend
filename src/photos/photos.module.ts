import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Controller, Get, Post, Delete,
    Param, Body, UseGuards, Request,
    UseInterceptors, UploadedFiles, Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// הגדרת Cloudinary מתוך משתני סביבה
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Entity('photos')
export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    publicId: string;

    @Column({ nullable: true })
    caption: string;

    @Column({ nullable: true })
    projectId: string;

    @ManyToOne(() => Project, (p) => p.photos, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column()
    ownerId: string;

    @Column({ nullable: true })
    takenAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}

@Injectable()
export class PhotosService {
    constructor(@InjectRepository(Photo) private repo: Repository<Photo>) { }

    findAll(ownerId: string, projectId?: string) {
        const where: any = { ownerId };
        if (projectId) where.projectId = projectId;
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async savePhotos(files: Express.Multer.File[], ownerId: string, projectId?: string, caption?: string) {
        const photos = files.map((file: any) =>
            this.repo.create({
                filename: file.originalname,
                url: file.path,           // ה-URL המלא מ-Cloudinary
                publicId: file.filename,  // ה-public_id למחיקה
                ownerId,
                projectId: projectId || null,
                caption: caption || null,
                takenAt: new Date(),
            }),
        );
        return this.repo.save(photos);
    }

    async remove(id: string, ownerId: string) {
        const photo = await this.repo.findOne({ where: { id, ownerId } });
        if (!photo) throw new NotFoundException('תמונה לא נמצאה');
        // מחיקה מ-Cloudinary
        if (photo.publicId) {
            try {
                await cloudinary.uploader.destroy(photo.publicId);
            } catch (e) {
                console.log('Cloudinary delete error:', e);
            }
        }
        await this.repo.remove(photo);
        return { message: 'תמונה נמחקה' };
    }
}

// אחסון Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'contractor-app',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'],
    } as any,
});

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
    constructor(private photosService: PhotosService) { }

    @Get()
    findAll(@Request() req, @Query('projectId') projectId?: string) {
        return this.photosService.findAll(req.user.id, projectId);
    }

    @Post('upload')
    @UseInterceptors(
        FilesInterceptor('files', 20, {
            storage,
            limits: { fileSize: 50 * 1024 * 1024 },
        }),
    )
    uploadPhotos(
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
        @Body('projectId') projectId?: string,
        @Body('caption') caption?: string,
    ) {
        return this.photosService.savePhotos(files, req.user.id, projectId, caption);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.photosService.remove(id, req.user.id);
    }
}

@Module({
    imports: [TypeOrmModule.forFeature([Photo]), MulterModule.register()],
    providers: [PhotosService],
    controllers: [PhotosController],
    exports: [PhotosService],
})
export class PhotosModule { }