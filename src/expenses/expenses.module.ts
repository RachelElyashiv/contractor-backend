import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'other' })
  category: string; // materials | equipment | labor | vehicle | other

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  supplier: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expense) private repo: Repository<Expense>) {}

  findAll(ownerId: string, projectId?: string) {
    const where: any = { ownerId };
    if (projectId) where.projectId = projectId;
    return this.repo.find({ where, order: { date: 'DESC' } });
  }

  async findOne(id: string, ownerId: string) {
    const e = await this.repo.findOne({ where: { id, ownerId } });
    if (!e) throw new NotFoundException('הוצאה לא נמצאה');
    return e;
  }

  create(data: Partial<Expense>, ownerId: string) {
    const e = this.repo.create({ ...data, ownerId, date: data.date || new Date() as any });
    return this.repo.save(e);
  }

  async update(id: string, data: Partial<Expense>, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.repo.update(id, data);
    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    const e = await this.findOne(id, ownerId);
    await this.repo.remove(e);
    return { message: 'הוצאה נמחקה' };
  }

  async getMonthlySummary(ownerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await this.repo
      .createQueryBuilder('e')
      .where('e.ownerId = :ownerId', { ownerId })
      .andWhere('e.date >= :start', { start: startOfMonth })
      .getMany();

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory = expenses.reduce((acc: any, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    return { total, byCategory, count: expenses.length };
  }
}

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    return this.expensesService.findAll(req.user.id, projectId);
  }

  @Get('summary')
  getSummary(@Request() req) { return this.expensesService.getMonthlySummary(req.user.id); }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.expensesService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.expensesService.create(body, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.expensesService.update(id, body, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.expensesService.remove(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
