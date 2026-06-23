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
exports.MaterialsModule = exports.MaterialsController = exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const material_entity_1 = require("./material.entity");
const common_2 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const common_3 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MaterialsService = class MaterialsService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(ownerId) {
        return this.repo.find({ where: { ownerId }, order: { name: 'ASC' } });
    }
    findByProject(projectId, ownerId) {
        return this.repo.find({ where: { projectId, ownerId }, order: { name: 'ASC' } });
    }
    async findOne(id, ownerId) {
        const m = await this.repo.findOne({ where: { id, ownerId } });
        if (!m)
            throw new common_2.NotFoundException('חומר לא נמצא');
        return m;
    }
    create(data, ownerId) {
        const m = this.repo.create({ ...data, ownerId });
        return this.repo.save(m);
    }
    async update(id, data, ownerId) {
        await this.findOne(id, ownerId);
        await this.repo.update(id, data);
        return this.findOne(id, ownerId);
    }
    async remove(id, ownerId) {
        const m = await this.findOne(id, ownerId);
        await this.repo.remove(m);
        return { message: 'חומר נמחק' };
    }
    getLowStock(ownerId) {
        return this.repo
            .createQueryBuilder('m')
            .where('m.ownerId = :ownerId', { ownerId })
            .andWhere('m.quantity <= m.minQuantity')
            .getMany();
    }
    async adjustQuantity(id, ownerId, delta) {
        const m = await this.findOne(id, ownerId);
        m.quantity = Number(m.quantity) + delta;
        return this.repo.save(m);
    }
    async updateDeliveryStatus(id, ownerId, status, notes, imageUrl) {
        await this.findOne(id, ownerId);
        const updateData = { deliveryStatus: status };
        if (notes)
            updateData.deliveryNotes = notes;
        if (imageUrl)
            updateData.deliveryImageUrl = imageUrl;
        await this.repo.update(id, updateData);
        return this.findOne(id, ownerId);
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(material_entity_1.Material)),
    __metadata("design:paramtypes", [typeorm_3.Repository])
], MaterialsService);
let MaterialsController = class MaterialsController {
    constructor(materialsService) {
        this.materialsService = materialsService;
    }
    findAll(req, projectId) {
        if (projectId)
            return this.materialsService.findByProject(projectId, req.user.id);
        return this.materialsService.findAll(req.user.id);
    }
    getLowStock(req) { return this.materialsService.getLowStock(req.user.id); }
    findOne(id, req) {
        return this.materialsService.findOne(id, req.user.id);
    }
    create(body, req) {
        return this.materialsService.create(body, req.user.id);
    }
    update(id, body, req) {
        return this.materialsService.update(id, body, req.user.id);
    }
    remove(id, req) {
        return this.materialsService.remove(id, req.user.id);
    }
    adjust(id, body, req) {
        return this.materialsService.adjustQuantity(id, req.user.id, body.delta);
    }
    updateDelivery(id, body, req) {
        return this.materialsService.updateDeliveryStatus(id, req.user.id, body.status, body.notes, body.imageUrl);
    }
};
exports.MaterialsController = MaterialsController;
__decorate([
    (0, common_3.Get)(),
    __param(0, (0, common_3.Request)()),
    __param(1, (0, common_3.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findAll", null);
__decorate([
    (0, common_3.Get)('low-stock'),
    __param(0, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "getLowStock", null);
__decorate([
    (0, common_3.Get)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findOne", null);
__decorate([
    (0, common_3.Post)(),
    __param(0, (0, common_3.Body)()),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "create", null);
__decorate([
    (0, common_3.Patch)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Body)()),
    __param(2, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "update", null);
__decorate([
    (0, common_3.Delete)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "remove", null);
__decorate([
    (0, common_3.Post)(':id/adjust'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Body)()),
    __param(2, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "adjust", null);
__decorate([
    (0, common_3.Patch)(':id/delivery'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Body)()),
    __param(2, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "updateDelivery", null);
exports.MaterialsController = MaterialsController = __decorate([
    (0, common_3.Controller)('materials'),
    (0, common_3.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [MaterialsService])
], MaterialsController);
let MaterialsModule = class MaterialsModule {
};
exports.MaterialsModule = MaterialsModule;
exports.MaterialsModule = MaterialsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([material_entity_1.Material])],
        providers: [MaterialsService],
        controllers: [MaterialsController],
        exports: [MaterialsService],
    })
], MaterialsModule);
//# sourceMappingURL=materials.module.js.map