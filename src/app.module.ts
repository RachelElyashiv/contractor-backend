import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkersModule } from './workers/workers.module';
import { MaterialsModule } from './materials/materials.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PhotosModule } from './photos/photos.module';
import { ApartmentsModule } from './apartments/apartments.module';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Task } from './projects/task.entity';
import { Worker } from './workers/worker.entity';
import { Attendance } from './workers/attendance.entity';
import { Material } from './materials/material.entity';
import { Invoice } from './invoices/invoice.entity';
import { InvoiceItem } from './invoices/invoice-item.entity';
import { Expense } from './expenses/expense.entity';
import { Photo } from './photos/photo.entity';
import { Apartment } from './apartments/apartments.module';
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get('DB_USERNAME', 'postgres'),
                password: config.get('DB_PASSWORD', 'password'),
                database: config.get('DB_NAME', 'contractor_db'),
                entities: [
                    User, Project, Task, Worker, Attendance,
                    Material, Invoice, InvoiceItem, Expense, Photo, Apartment,
                ],
                synchronize: config.get('NODE_ENV') !== 'production',
                logging: config.get('NODE_ENV') !== 'production' ? ['error', 'warn', 'query'] : ['error', 'warn'],
                ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
            }),
        }),
        AuthModule,
        UsersModule,
        ProjectsModule,
        WorkersModule,
        MaterialsModule,
        InvoicesModule,
        ExpensesModule,
        PhotosModule,
        ApartmentsModule,
    ],
})
export class AppModule { }
