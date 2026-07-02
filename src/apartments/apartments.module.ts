import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
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

@Entity('apartments')
export class Apartment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @Column({ nullable: true })
  projectId: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Injectable()
export class ApartmentsService {
  constructor(@InjectRepository(Apartment) private repo: Repository<Apartment>) {}

  findAll(ownerId: string) {
    return this.repo.find({ where: { ownerId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  findByProject(projectId: string, ownerId: string) {
    return this.repo.find({ where: { projectId, ownerId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string, ownerId: string) {
    const apt = await this.repo.findOne({ where: { id, ownerId } });
    if (!apt) throw new NotFoundException('דירה לא נמצאה');
    return apt;
  }

  async create(data: Partial<Apartment>, ownerId: string) {
    const count = await this.repo.count({ where: { projectId: data.projectId as any, ownerId } });
    const apt = this.repo.create({ ...data, ownerId, sortOrder: count + 1 });
    return this.repo.save(apt);
  }

  async update(id: string, data: Partial<Apartment>, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.repo.update(id, data);
    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    const apt = await this.findOne(id, ownerId);
    await this.repo.remove(apt);
    return { message: 'דירה נמחקה' };
  }
}

@Controller('apartments')
@UseGuards(JwtAuthGuard)
export class ApartmentsController {
  constructor(private apartmentsService: ApartmentsService) {}

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    if (projectId) return this.apartmentsService.findByProject(projectId, req.user.id);
    return this.apartmentsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.apartmentsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.apartmentsService.create(body, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.apartmentsService.update(id, body, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.apartmentsService.remove(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Apartment])],
  providers: [ApartmentsService],
  controllers: [ApartmentsController],
  exports: [ApartmentsService],
})
export class ApartmentsModule {}
