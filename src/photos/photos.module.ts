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
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ArgumentsHost, Catch, ExceptionFilter, HttpException,
    Controller, Get, Post, Delete,
    Param, Body, UseGuards, UseFilters, Request,
    UseInterceptors, UploadedFiles, Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// הגדרת Cloudinary מתוך משתני סביבה. נקראת מחדש בכל שימוש, כי סדר הטעינה
// של המודולים לא מבטיח שמשתני הסביבה כבר קיימים ברגע שהקובץ הזה נטען.
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    return cloudinary.config();
}
configureCloudinary();

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
        // מחיקה מ-Cloudinary. קובץ שאינו תמונה נשמר כ-raw, ומחיקה שלו
        // נכשלת בשקט אם לא מציינים את סוג המשאב.
        if (photo.publicId) {
            try {
                const resourceType = (photo.url || '').includes('/raw/') ? 'raw' : 'image';
                await cloudinary.uploader.destroy(photo.publicId, { resource_type: resourceType });
            } catch (e) {
                console.log('Cloudinary delete error:', e);
            }
        }
        await this.repo.remove(photo);
        return { message: 'תמונה נמחקה' };
    }
}

// שם קובץ בטוח ל-Cloudinary: בלי סיומת, בלי תווים שמשברים כתובת
function safePublicId(originalname: string) {
    const ext = extname(originalname || '');
    const base = (originalname || 'file').slice(0, originalname.length - ext.length);
    const clean = base.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    return { clean: clean || 'file', ext: ext.replace('.', '').toLowerCase(), unique };
}

// אחסון Cloudinary.
// תמונות נשמרות כ-image, וכל השאר (PDF, DWG, Word, Excel — תוכניות בנייה
// ותעודות משלוח) נשמר כ-raw. אין רשימת פורמטים מותרים, כדי שכל קובץ שהקבלן
// צריך יעלה. raw גם עוקף את חסימת הצגת PDF שקיימת בחשבונות Cloudinary חדשים.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        const isImage = (file.mimetype || '').startsWith('image/');
        const { clean, ext, unique } = safePublicId(file.originalname);
        return {
            folder: 'contractor-app',
            resource_type: isImage ? 'image' : 'raw',
            // ב-raw הסיומת חייבת להיות חלק מה-public_id, אחרת הכתובת נפתחת כקובץ ללא סוג
            public_id: isImage ? `${clean}-${unique}` : `${clean}-${unique}${ext ? '.' + ext : ''}`,
        };
    },
});

// בלי זה כל כישלון העלאה חוזר לאפליקציה כ-"Internal server error" בלי שום רמז
@Catch()
export class UploadErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();
        if (exception instanceof HttpException) {
            return res.status(exception.getStatus()).json(exception.getResponse());
        }
        const detail = exception?.message || exception?.error?.message || String(exception);
        console.error('Upload failed:', detail, exception);
        return res.status(502).json({
            statusCode: 502,
            error: 'UploadFailed',
            message: `ההעלאה נכשלה: ${detail}`,
            detail,
        });
    }
}

// בדיקת תקינות של חיבור Cloudinary — פתוחה בלי התחברות, כדי שאפשר יהיה
// לפתוח אותה בדפדפן ולראות מיד אם המפתחות שהוזנו בפריסה נכונים.
// לא נחשף שום סוד: שם החשבון מופיע ממילא בכל כתובת תמונה, ומהמפתח מוצגות
// ארבע ספרות אחרונות בלבד.
@Controller('uploads-health')
export class UploadsHealthController {
    @Get()
    async check() {
        const cfg = configureCloudinary();
        const cloudName = cfg.cloud_name || null;
        const apiKey = cfg.api_key ? String(cfg.api_key) : null;
        const apiSecret = cfg.api_secret ? String(cfg.api_secret) : null;
        const credentials = {
            cloudName,
            apiKeyTail: apiKey ? apiKey.slice(-4) : null,
            apiSecretLength: apiSecret ? apiSecret.length : 0,
        };

        if (!cloudName || !apiKey || !apiSecret) {
            return {
                ok: false,
                reason: 'missing_credentials',
                credentials,
                message: 'חסרים משתני סביבה של Cloudinary בשרת',
            };
        }

        try {
            const ping: any = await cloudinary.api.ping();
            const ok = ping?.status === 'ok';
            return {
                ok,
                reason: ok ? null : 'ping_failed',
                credentials,
                ping,
                message: ok ? 'Cloudinary מחובר' : 'Cloudinary ענה תשובה לא צפויה',
            };
        } catch (e: any) {
            return {
                ok: false,
                reason: 'ping_error',
                credentials,
                httpCode: e?.error?.http_code || e?.http_code || null,
                error: e?.error?.message || e?.message || String(e),
                message: 'המפתחות של Cloudinary לא תקינים',
            };
        }
    }
}

@Controller('photos')
@UseGuards(JwtAuthGuard)
@UseFilters(UploadErrorFilter)
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
        // Cloud Run חוסם בקשה מעל 32MB, אז הגבול כאן נמוך ממנו בכוונה
        FilesInterceptor('files', 20, {
            storage,
            limits: { fileSize: 25 * 1024 * 1024 },
        }),
    )
    async uploadPhotos(
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
        @Body('projectId') projectId?: string,
        @Body('caption') caption?: string,
        @Body('apartmentId') apartmentId?: string,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('לא התקבל אף קובץ');
        }
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
    controllers: [PhotosController, UploadsHealthController],
    exports: [PhotosService],
})
export class PhotosModule { }