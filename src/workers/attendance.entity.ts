import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Worker } from './worker.entity';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  checkIn: string; // '07:30'

  @Column({ nullable: true })
  checkOut: string; // '16:00'

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  hoursWorked: number;

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: 'present' })
  status: string; // present | absent | late | half-day

  @ManyToOne(() => Worker, (w) => w.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @Column()
  workerId: string;

  @CreateDateColumn()
  createdAt: Date;
}
