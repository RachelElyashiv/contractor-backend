"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const projects_module_1 = require("./projects/projects.module");
const workers_module_1 = require("./workers/workers.module");
const materials_module_1 = require("./materials/materials.module");
const invoices_module_1 = require("./invoices/invoices.module");
const expenses_module_1 = require("./expenses/expenses.module");
const photos_module_1 = require("./photos/photos.module");
const user_entity_1 = require("./users/user.entity");
const project_entity_1 = require("./projects/project.entity");
const task_entity_1 = require("./projects/task.entity");
const worker_entity_1 = require("./workers/worker.entity");
const attendance_entity_1 = require("./workers/attendance.entity");
const material_entity_1 = require("./materials/material.entity");
const invoice_entity_1 = require("./invoices/invoice.entity");
const invoice_item_entity_1 = require("./invoices/invoice-item.entity");
const expense_entity_1 = require("./expenses/expense.entity");
const photo_entity_1 = require("./photos/photo.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 5432),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.get('DB_PASSWORD', 'password'),
                    database: config.get('DB_NAME', 'contractor_db'),
                    entities: [
                        user_entity_1.User, project_entity_1.Project, task_entity_1.Task, worker_entity_1.Worker, attendance_entity_1.Attendance,
                        material_entity_1.Material, invoice_entity_1.Invoice, invoice_item_entity_1.InvoiceItem, expense_entity_1.Expense, photo_entity_1.Photo,
                    ],
                    synchronize: config.get('NODE_ENV') !== 'production',
                    logging: false,
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            workers_module_1.WorkersModule,
            materials_module_1.MaterialsModule,
            invoices_module_1.InvoicesModule,
            expenses_module_1.ExpensesModule,
            photos_module_1.PhotosModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map