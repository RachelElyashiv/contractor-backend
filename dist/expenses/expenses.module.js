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
exports.ExpensesModule = exports.ExpensesController = exports.ExpensesService = exports.Expense = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const common_2 = require("@nestjs/common");
const typeorm_3 = require("@nestjs/typeorm");
const typeorm_4 = require("typeorm");
const common_3 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let Expense = class Expense {
};
exports.Expense = Expense;
__decorate([
    (0, typeorm_2.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Expense.prototype, "id", void 0);
__decorate([
    (0, typeorm_2.Column)(),
    __metadata("design:type", String)
], Expense.prototype, "description", void 0);
__decorate([
    (0, typeorm_2.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Expense.prototype, "amount", void 0);
__decorate([
    (0, typeorm_2.Column)({ default: 'other' }),
    __metadata("design:type", String)
], Expense.prototype, "category", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "receiptUrl", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_2.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Expense.prototype, "date", void 0);
__decorate([
    (0, typeorm_2.Column)({ nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "notes", void 0);
__decorate([
    (0, typeorm_2.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_2.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", user_entity_1.User)
], Expense.prototype, "owner", void 0);
__decorate([
    (0, typeorm_2.Column)(),
    __metadata("design:type", String)
], Expense.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_2.CreateDateColumn)(),
    __metadata("design:type", Date)
], Expense.prototype, "createdAt", void 0);
exports.Expense = Expense = __decorate([
    (0, typeorm_2.Entity)('expenses')
], Expense);
let ExpensesService = class ExpensesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(ownerId, projectId) {
        const where = { ownerId };
        if (projectId)
            where.projectId = projectId;
        return this.repo.find({ where, order: { date: 'DESC' } });
    }
    async findOne(id, ownerId) {
        const e = await this.repo.findOne({ where: { id, ownerId } });
        if (!e)
            throw new common_2.NotFoundException('הוצאה לא נמצאה');
        return e;
    }
    create(data, ownerId) {
        const e = this.repo.create({ ...data, ownerId, date: data.date || new Date() });
        return this.repo.save(e);
    }
    async update(id, data, ownerId) {
        await this.findOne(id, ownerId);
        await this.repo.update(id, data);
        return this.findOne(id, ownerId);
    }
    async remove(id, ownerId) {
        const e = await this.findOne(id, ownerId);
        await this.repo.remove(e);
        return { message: 'הוצאה נמחקה' };
    }
    async getMonthlySummary(ownerId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const expenses = await this.repo
            .createQueryBuilder('e')
            .where('e.ownerId = :ownerId', { ownerId })
            .andWhere('e.date >= :start', { start: startOfMonth })
            .getMany();
        const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
        const byCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
            return acc;
        }, {});
        return { total, byCategory, count: expenses.length };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, typeorm_3.InjectRepository)(Expense)),
    __metadata("design:paramtypes", [typeorm_4.Repository])
], ExpensesService);
let ExpensesController = class ExpensesController {
    constructor(expensesService) {
        this.expensesService = expensesService;
    }
    findAll(req, projectId) {
        return this.expensesService.findAll(req.user.id, projectId);
    }
    getSummary(req) { return this.expensesService.getMonthlySummary(req.user.id); }
    findOne(id, req) {
        return this.expensesService.findOne(id, req.user.id);
    }
    create(body, req) {
        return this.expensesService.create(body, req.user.id);
    }
    update(id, body, req) {
        return this.expensesService.update(id, body, req.user.id);
    }
    remove(id, req) {
        return this.expensesService.remove(id, req.user.id);
    }
};
exports.ExpensesController = ExpensesController;
__decorate([
    (0, common_3.Get)(),
    __param(0, (0, common_3.Request)()),
    __param(1, (0, common_3.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findAll", null);
__decorate([
    (0, common_3.Get)('summary'),
    __param(0, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "getSummary", null);
__decorate([
    (0, common_3.Get)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findOne", null);
__decorate([
    (0, common_3.Post)(),
    __param(0, (0, common_3.Body)()),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "create", null);
__decorate([
    (0, common_3.Patch)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Body)()),
    __param(2, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "update", null);
__decorate([
    (0, common_3.Delete)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "remove", null);
exports.ExpensesController = ExpensesController = __decorate([
    (0, common_3.Controller)('expenses'),
    (0, common_3.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ExpensesService])
], ExpensesController);
let ExpensesModule = class ExpensesModule {
};
exports.ExpensesModule = ExpensesModule;
exports.ExpensesModule = ExpensesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([Expense])],
        providers: [ExpensesService],
        controllers: [ExpensesController],
        exports: [ExpensesService],
    })
], ExpensesModule);
//# sourceMappingURL=expenses.module.js.map