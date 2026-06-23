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
exports.WorkersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const worker_entity_1 = require("./worker.entity");
const attendance_entity_1 = require("./attendance.entity");
let WorkersService = class WorkersService {
    constructor(workerRepo, attendanceRepo) {
        this.workerRepo = workerRepo;
        this.attendanceRepo = attendanceRepo;
    }
    async findAll(ownerId) {
        return this.workerRepo.find({
            where: { ownerId, isActive: true },
            order: { firstName: 'ASC' },
        });
    }
    async findOne(id, ownerId) {
        const worker = await this.workerRepo.findOne({ where: { id, ownerId } });
        if (!worker)
            throw new common_1.NotFoundException('עובד לא נמצא');
        return worker;
    }
    async create(data, ownerId) {
        const worker = this.workerRepo.create({ ...data, ownerId });
        return this.workerRepo.save(worker);
    }
    async update(id, data, ownerId) {
        await this.findOne(id, ownerId);
        await this.workerRepo.update(id, data);
        return this.findOne(id, ownerId);
    }
    async remove(id, ownerId) {
        const worker = await this.findOne(id, ownerId);
        worker.isActive = false;
        await this.workerRepo.save(worker);
        return { message: 'עובד הוסר' };
    }
    async getAttendanceToday(ownerId) {
        const today = new Date().toISOString().split('T')[0];
        const workers = await this.findAll(ownerId);
        const workerIds = workers.map((w) => w.id);
        if (!workerIds.length)
            return [];
        const attendances = await this.attendanceRepo.find({
            where: { date: today },
            relations: { worker: true },
        });
        return workers.map((w) => ({
            ...w,
            todayAttendance: attendances.find((a) => a.workerId === w.id) || null,
        }));
    }
    async markAttendance(workerId, data) {
        const existing = await this.attendanceRepo.findOne({
            where: { workerId, date: data.date },
        });
        if (existing) {
            Object.assign(existing, data);
            return this.attendanceRepo.save(existing);
        }
        const attendance = this.attendanceRepo.create({ ...data, workerId });
        return this.attendanceRepo.save(attendance);
    }
    async getMonthlyReport(ownerId, year, month) {
        const workers = await this.findAll(ownerId);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const report = await Promise.all(workers.map(async (w) => {
            const attendances = await this.attendanceRepo.find({
                where: {
                    workerId: w.id,
                    date: (0, typeorm_2.Between)(startDate, endDate),
                },
            });
            const totalHours = attendances.reduce((sum, a) => sum + Number(a.hoursWorked), 0);
            const daysPresent = attendances.filter((a) => a.status === 'present').length;
            const totalPay = daysPresent * Number(w.dailyRate);
            return { worker: w, totalHours, daysPresent, totalPay, attendances };
        }));
        return report;
    }
};
exports.WorkersService = WorkersService;
exports.WorkersService = WorkersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(worker_entity_1.Worker)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkersService);
//# sourceMappingURL=workers.service.js.map