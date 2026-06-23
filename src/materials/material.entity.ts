import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('materials')
export class Material {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: 'unit' })
    unit: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    minQuantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    unitPrice: number;

    @Column({ nullable: true })
    supplier: string;

    @Column({ nullable: true })
    supplierPhone: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    projectId: string;

    @Column({ nullable: true })
    category: string;

    @Column({ default: 'pending' })
    deliveryStatus: string;

    @Column({ nullable: true })
    deliveryNotes: string;

    @Column({ nullable: true })
    deliveryImageUrl: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column()
    ownerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}