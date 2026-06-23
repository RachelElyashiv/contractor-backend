import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance } from './attendance.entity';

@Entity('workers')
export class Worker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  role: string; // בנאי, חשמלאי, אינסטלטור, פועל, מנהל עבודה

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  dailyRate: number;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Attendance, (a) => a.worker, { cascade: true })
  attendances: Attendance[];

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
