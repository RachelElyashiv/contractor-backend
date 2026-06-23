import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
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

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  url: string;

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
  constructor(@InjectRepository(Photo) private repo: Repository<Photo>) {}

  findAll(ownerId: string, projectId?: string) {
    const where: any = { ownerId };
    if (projectId) where.projectId = projectId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async savePhotos(files: Express.Multer.File[], ownerId: string, projectId?: string, caption?: string) {
    const photos = files.map((file) =>
      this.repo.create({
        filename: file.filename,
        url: `/uploads/${file.filename}`,
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
    const filePath = join(process.cwd(), 'uploads', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.repo.remove(photo);
    return { message: 'תמונה נמחקה' };
  }
}

const uploadDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    return this.photosService.findAll(req.user.id, projectId);
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
      fileFilter: (_, file, cb) => {
          const allowed = /jpeg|jpg|png|gif|webp|heic|pdf/;
        cb(null, allowed.test(extname(file.originalname).toLowerCase()));
      },
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
export class PhotosModule {}
