import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Worker } from './worker.entity';
import { Attendance } from './attendance.entity';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker) private workerRepo: Repository<Worker>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
  ) {}

  async findAll(ownerId: string) {
    return this.workerRepo.find({
      where: { ownerId, isActive: true },
      order: { firstName: 'ASC' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const worker = await this.workerRepo.findOne({ where: { id, ownerId } });
    if (!worker) throw new NotFoundException('עובד לא נמצא');
    return worker;
  }

  async create(data: Partial<Worker>, ownerId: string) {
    const worker = this.workerRepo.create({ ...data, ownerId });
    return this.workerRepo.save(worker);
  }

  async update(id: string, data: Partial<Worker>, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.workerRepo.update(id, data);
    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    const worker = await this.findOne(id, ownerId);
    worker.isActive = false;
    await this.workerRepo.save(worker);
    return { message: 'עובד הוסר' };
  }

  // Attendance
  async getAttendanceToday(ownerId: string) {
    const today = new Date().toISOString().split('T')[0];
    const workers = await this.findAll(ownerId);
    const workerIds = workers.map((w) => w.id);
    if (!workerIds.length) return [];

    const attendances = await this.attendanceRepo.find({
      where: { date: today as any },
      relations: { worker: true },
    });

    return workers.map((w) => ({
      ...w,
      todayAttendance: attendances.find((a) => a.workerId === w.id) || null,
    }));
  }

  async markAttendance(workerId: string, data: Partial<Attendance>) {
    const existing = await this.attendanceRepo.findOne({
      where: { workerId, date: data.date as any },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.attendanceRepo.save(existing);
    }

    const attendance = this.attendanceRepo.create({ ...data, workerId });
    return this.attendanceRepo.save(attendance);
  }

  async getMonthlyReport(ownerId: string, year: number, month: number) {
    const workers = await this.findAll(ownerId);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const report = await Promise.all(
      workers.map(async (w) => {
        const attendances = await this.attendanceRepo.find({
          where: {
            workerId: w.id,
            date: Between(startDate as any, endDate as any),
          },
        });
        const totalHours = attendances.reduce((sum, a) => sum + Number(a.hoursWorked), 0);
        const daysPresent = attendances.filter((a) => a.status === 'present').length;
        const totalPay = daysPresent * Number(w.dailyRate);
        return { worker: w, totalHours, daysPresent, totalPay, attendances };
      }),
    );
    return report;
  }
}
