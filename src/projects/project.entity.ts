import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { Photo } from '../photos/photo.entity';
import { Expense } from '../expenses/expense.entity';
import { Invoice } from '../invoices/invoice.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientPhone: string;

  @Column({ nullable: true })
  clientEmail: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'int', default: 0 })
  progressPercent: number;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @ManyToOne(() => User, (u) => u.projects, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Task, (t) => t.project, { cascade: true })
  tasks: Task[];

  @OneToMany(() => Photo, (p) => p.project)
  photos: Photo[];

  @OneToMany(() => Expense, (e) => e.projectId)
  expenses: Expense[];

  @OneToMany(() => Invoice, (i) => i.project)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
