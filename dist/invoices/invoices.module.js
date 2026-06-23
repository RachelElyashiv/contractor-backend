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
exports.InvoicesModule = exports.InvoicesController = exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invoice_entity_1 = require("./invoice.entity");
const invoice_item_entity_1 = require("./invoice-item.entity");
const common_2 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const common_3 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let InvoicesService = class InvoicesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(ownerId) {
        return this.repo.find({
            where: { ownerId },
            order: { createdAt: 'DESC' },
            relations: { items: true },
        });
    }
    async findOne(id, ownerId) {
        const inv = await this.repo.findOne({ where: { id, ownerId }, relations: { items: true } });
        if (!inv)
            throw new common_2.NotFoundException('חשבונית לא נמצאה');
        return inv;
    }
    async create(data, ownerId) {
        const count = await this.repo.count({ where: { ownerId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        const subtotal = (data.items || []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = subtotal * ((data.taxPercent || 17) / 100);
        const total = subtotal + taxAmount;
        const invoice = this.repo.create({
            ...data,
            invoiceNumber,
            ownerId,
            subtotal,
            taxAmount,
            total,
            issueDate: data.issueDate || new Date(),
        });
        return this.repo.save(invoice);
    }
    async update(id, data, ownerId) {
        await this.findOne(id, ownerId);
        await this.repo.update(id, data);
        return this.findOne(id, ownerId);
    }
    async markPaid(id, ownerId) {
        await this.findOne(id, ownerId);
        await this.repo.update(id, { status: invoice_entity_1.InvoiceStatus.PAID, paidDate: new Date() });
        return this.findOne(id, ownerId);
    }
    async remove(id, ownerId) {
        const inv = await this.findOne(id, ownerId);
        await this.repo.remove(inv);
        return { message: 'חשבונית נמחקה' };
    }
    async getSummary(ownerId) {
        const invoices = await this.findAll(ownerId);
        const paid = invoices.filter((i) => i.status === 'paid');
        const pending = invoices.filter((i) => i.status === 'sent');
        const overdue = invoices.filter((i) => i.status === 'overdue');
        return {
            totalRevenue: paid.reduce((s, i) => s + Number(i.total), 0),
            pendingAmount: pending.reduce((s, i) => s + Number(i.total), 0),
            overdueAmount: overdue.reduce((s, i) => s + Number(i.total), 0),
            counts: { total: invoices.length, paid: paid.length, pending: pending.length, overdue: overdue.length },
        };
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(invoice_entity_1.Invoice)),
    __metadata("design:paramtypes", [typeorm_3.Repository])
], InvoicesService);
let InvoicesController = class InvoicesController {
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    findAll(req) { return this.invoicesService.findAll(req.user.id); }
    getSummary(req) { return this.invoicesService.getSummary(req.user.id); }
    findOne(id, req) {
        return this.invoicesService.findOne(id, req.user.id);
    }
    create(body, req) {
        return this.invoicesService.create(body, req.user.id);
    }
    update(id, body, req) {
        return this.invoicesService.update(id, body, req.user.id);
    }
    markPaid(id, req) {
        return this.invoicesService.markPaid(id, req.user.id);
    }
    remove(id, req) {
        return this.invoicesService.remove(id, req.user.id);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_3.Get)(),
    __param(0, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_3.Get)('summary'),
    __param(0, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "getSummary", null);
__decorate([
    (0, common_3.Get)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_3.Post)(),
    __param(0, (0, common_3.Body)()),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_3.Patch)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Body)()),
    __param(2, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "update", null);
__decorate([
    (0, common_3.Post)(':id/mark-paid'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "markPaid", null);
__decorate([
    (0, common_3.Delete)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_3.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "remove", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_3.Controller)('invoices'),
    (0, common_3.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [InvoicesService])
], InvoicesController);
let InvoicesModule = class InvoicesModule {
};
exports.InvoicesModule = InvoicesModule;
exports.InvoicesModule = InvoicesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([invoice_entity_1.Invoice, invoice_item_entity_1.InvoiceItem])],
        providers: [InvoicesService],
        controllers: [InvoicesController],
        exports: [InvoicesService],
    })
], InvoicesModule);
//# sourceMappingURL=invoices.module.js.map