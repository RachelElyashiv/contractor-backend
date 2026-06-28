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

    @Column({ nullable: true })
    apartmentId: string;

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

    findAll(ownerId: string, projectId?: string, apartmentId?: string) {
        const where: any = { ownerId };
        if (apartmentId) where.apartmentId = apartmentId;
        else if (projectId) where.projectId = projectId;
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async savePhotos(files: Express.Multer.File[], ownerId: string, projectId?: string, caption?: string, apartmentId?: string) {
        const photos = files.map((file: any) =>
            this.repo.create({
                filename: file.originalname,
                url: file.path,
                publicId: file.filename,
                ownerId,
                projectId: projectId || null,
                apartmentId: apartmentId || null,
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
    findAll(
        @Request() req,
        @Query('projectId') projectId?: string,
        @Query('apartmentId') apartmentId?: string,
    ) {
        return this.photosService.findAll(req.user.id, projectId, apartmentId);
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
        @Body('apartmentId') apartmentId?: string,
    ) {
        return this.photosService.savePhotos(files, req.user.id, projectId, caption, apartmentId);
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