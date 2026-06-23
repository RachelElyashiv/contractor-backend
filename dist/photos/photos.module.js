"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotosModule = exports.PhotosController = exports.PhotosService = exports.Photo = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const fs = require("fs");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const project_entity_1 = require("../projects/project.entity");
const common_2 = require("@nestjs/common");
const typeorm_3 = require("@nestjs/typeorm");
const typeorm_4 = require("typeorm");
const common_3 = require("@nestjs/common");
const platform_express_2 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let Photo = class Photo {
};
exports.Photo = Photo;
__decorate([
    (0, typeorm_2.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Photo.prototype, "id", void 0);
__decorate([
    (0, typeorm_2.Column)(),
    __metadata("design:type", String)
], Photo.prototype, "filename", void 0);
__decorate([
    (0, typeorm_2.Column)(),
    __metadata("design:type", String)
], Photo.prototype, "url", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Photo.prototype, "caption", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Photo.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_2.ManyToOne)(() => project_entity_1.Project, (p) => p.photos, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_2.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], Photo.prototype, "project", void 0);
__decorate([
    (0, typeorm_2.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_2.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", user_entity_1.User)
], Photo.prototype, "owner", void 0);
__decorate([
    (0, typeorm_2.Column)(),
    __metadata("design:type", String)
], Photo.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Photo.prototype, "takenAt", void 0);
__decorate([
    (0, typeorm_2.CreateDateColumn)(),
    __metadata("design:type", Date)
], Photo.prototype, "createdAt", void 0);
exports.Photo = Photo = __decorate([
    (0, typeorm_2.Entity)('photos')
], Photo);
let PhotosService = class PhotosService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(ownerId, projectId) {
        const where = { ownerId };
        if (projectId)
            where.projectId = projectId;
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }
    async savePhotos(files, ownerId, projectId, caption) {
        const photos = files.map((file) => this.repo.create({
            filename: file.filename,
            url: `/uploads/${file.filename}`,
            ownerId,
            projectId: projectId || null,
            caption: caption || null,
            takenAt: new Date(),
        }));
        return this.repo.save(photos);
    }
    async remove(id, ownerId) {
        const photo = await this.repo.findOne({ where: { id, ownerId } });
        if (!photo)
            throw new common_2.NotFoundException('תמונה לא נמצאה');
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', photo.filename);
        if (fs.existsSync(filePath))
            fs.unlinkSync(filePath);
        await this.repo.remove(photo);
        return { message: 'תמונה נמחקה' };
    }
};
exports.PhotosService = PhotosService;
exports.PhotosService = PhotosService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, typeorm_3.InjectRepository)(Photo)),
    __metadata("design:paramtypes", [typeorm_4.Repository])
], PhotosService);
const uploadDir = (0, path_1.join)(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });
let PhotosController = class PhotosController {
    constructor(photosService) {
        this.photosService = photosService;
    }
    findAll(req, projectId) {
        return this.photosService.findAll(req.user.id, projectId);
    }
    uploadPhotos(files, req, projectId, caption) {
        return this.photosService.savePhotos(files, req.user.id, projectId, caption);
    }
    remove(id, req) {
        return this.photosService.remove(id, req.user.id);
    }
};
exports.PhotosController = PhotosController;
__decorate([
    (0, common_3.Get)(),
    __param(0, (0, common_3.Request)()),
    __param(1, (0, common_3.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PhotosController.prototype, "findAll", null);
__decorate([
    (0, common_3.Post)('upload'),
    (0, common_3.UseInterceptors)((0, platform_express_2.FilesInterceptor)('files', 20, {
        storage: (0, multer_1.diskStorage)({
            destination: uploadDir,
            filename: (_, file, cb) => cb(null, `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`),
        }),
        fileFilter: (_, file, cb) => {
            const allowed = /jpeg|jpg|png|gif|webp|heic|pdf/;
            cb(null, allowed.test((0, path_1.extname)(file.originalname).toLowerCase()));
        },
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_3.UploadedFiles)()),
    __param(1, (0, common_3.Request)()),
    __param(2, (0, common_3.Body)('projectId')),
    __param(3, (0, common_3.Body)('caption')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, String, String]),
    __metadata("design:returntype", void 0)
], PhotosController.prototype, "uploadPhotos", null);
__decorate([
    (0, common_3.Delete)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PhotosController.prototype, "remove", null);
exports.PhotosController = PhotosController = __decorate([
    (0, common_3.Controller)('photos'),
    (0, common_3.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [PhotosService])
], PhotosController);
let PhotosModule = class PhotosModule {
};
exports.PhotosModule = PhotosModule;
exports.PhotosModule = PhotosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([Photo]), platform_express_1.MulterModule.register()],
        providers: [PhotosService],
        controllers: [PhotosController],
        exports: [PhotosService],
    })
], PhotosModule);
//# sourceMappingURL=photos.module.js.map