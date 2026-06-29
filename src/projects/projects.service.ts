import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Photo } from '../photos/photo.entity';
import { Material } from '../materials/material.entity';
import { Invoice } from '../invoices/invoice.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project) private projectRepo: Repository<Project>,
        @InjectRepository(Task) private taskRepo: Repository<Task>,
        @InjectRepository(Photo) private photoRepo: Repository<Photo>,
        @InjectRepository(Material) private materialRepo: Repository<Material>,
        @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    ) { }

    async findAll(ownerId: string) {
        return this.projectRepo.find({
            where: { ownerId },
            relations: { tasks: true },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, ownerId: string) {
        const project = await this.projectRepo.findOne({
            where: { id },
            relations: { tasks: true, photos: true, expenses: true, invoices: true },
        });
        if (!project) throw new NotFoundException('פרויקט לא נמצא');
        if (project.ownerId !== ownerId) throw new ForbiddenException();
        return project;
    }

    async create(data: Partial<Project>, ownerId: string) {
        const project = this.projectRepo.create({ ...data, ownerId });
        return this.projectRepo.save(project);
    }

    async update(id: string, data: Partial<Project>, ownerId: string) {
        const project = await this.findOne(id, ownerId);
        Object.assign(project, data);
        return this.projectRepo.save(project);
    }

    async remove(id: string, ownerId: string) {
        const project = await this.projectRepo.findOne({ where: { id, ownerId } });
        if (!project) throw new NotFoundException('פרויקט לא נמצא');
        await this.invoiceRepo.update({ projectId: id }, { projectId: null });
        await this.projectRepo.delete({ id, ownerId });
        return { message: 'פרויקט נמחק' };
    }

    async getTasks(projectId: string, ownerId: string) {
        await this.findOne(projectId, ownerId);
        return this.taskRepo.find({
            where: { projectId },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
    }

    async createTask(projectId: string, data: Partial<Task>, ownerId: string) {
        await this.findOne(projectId, ownerId);
        const task = this.taskRepo.create({ ...data, projectId });
        return this.taskRepo.save(task);
    }

    async updateTask(taskId: string, data: Partial<Task>) {
        await this.taskRepo.update(taskId, data);
        return this.taskRepo.findOne({ where: { id: taskId } });
    }

    async removeTask(taskId: string) {
        await this.taskRepo.delete(taskId);
        return { message: 'משימה נמחקה' };
    }

    async getDashboardStats(ownerId: string) {
        const projects = await this.findAll(ownerId);
        const active = projects.filter((p) => p.status === 'active').length;
        const delayed = projects.filter((p) => p.status === 'delayed').length;
        const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);
        const totalPaid = projects.reduce((sum, p) => sum + Number(p.amountPaid), 0);
        return { total: projects.length, active, delayed, totalBudget, totalPaid, projects };
    }

    async generateReport(projectId: string, ownerId: string): Promise<string> {
        const project = await this.projectRepo.findOne({ where: { id: projectId } });
        if (!project) throw new Error('פרויקט לא נמצא');
        const photos = await this.photoRepo.find({ where: { projectId } });
        const materials = await this.materialRepo.find({ where: { projectId } });

        const images = photos.filter(p => !p.filename?.toLowerCase().endsWith('.pdf') && !p.caption?.toLowerCase().includes('pdf'));
        const pdfs = photos.filter(p => p.filename?.toLowerCase().endsWith('.pdf') || p.caption?.toLowerCase().includes('pdf'));

        const statusLabel = { active: 'פעיל', delayed: 'מאחר', completed: 'הושלם', pending: 'ממתין' };
        const deliveryLabel = { pending: 'ממתין', arrived_ok: 'הגיע תקין ✓', arrived_damaged: 'הגיע פגום ⚠', not_arrived: 'לא הגיע ✕' };
        const deliveryColor = { pending: '#ba7517', arrived_ok: '#1a6b4a', arrived_damaged: '#a32d2d', not_arrived: '#555' };

        const imagesHtml = images.map(img => `
      <div style="break-inside:avoid;margin-bottom:16px">
        <img src="http://127.0.0.1:3000${img.url}" style="width:100%;border-radius:12px;object-fit:cover;max-height:300px" />
        ${img.caption ? `<p style="text-align:right;color:#555;font-size:13px;margin-top:6px">${img.caption}</p>` : ''}
      </div>
    `).join('');

        const materialsHtml = materials.map(m => `
      <div style="background:#f9f9f9;border-radius:10px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:${deliveryColor[m.deliveryStatus] || '#ba7517'};font-weight:600;font-size:14px">${deliveryLabel[m.deliveryStatus] || 'ממתין'}</span>
        <div style="text-align:right">
          <div style="font-weight:600;font-size:15px">${m.name}</div>
          ${m.supplier ? `<div style="color:#888;font-size:13px">ספק: ${m.supplier}</div>` : ''}
          <div style="color:#888;font-size:13px">כמות: ${m.quantity} ${m.unit}</div>
        </div>
        ${m.deliveryImageUrl ? `<img src="http://127.0.0.1:3000${m.deliveryImageUrl}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;margin-right:10px" />` : ''}
      </div>
    `).join('');

        const pdfsHtml = pdfs.map(pdf => `
      <div style="background:#fff5f5;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <a href="http://127.0.0.1:3000${pdf.url}" target="_blank" style="color:#a32d2d;font-size:13px">פתח קובץ</a>
        <span style="color:#333;font-size:14px">${pdf.caption || pdf.filename}</span>
      </div>
    `).join('');

        const date = new Date().toLocaleDateString('he-IL');

        return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>דוח פרויקט – ${project.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f0f4f0; color: #1a1a1a; direction: rtl; }
  .header { background: #1a6b4a; color: white; padding: 32px 24px; }
  .header h1 { font-size: 24px; margin-bottom: 6px; }
  .header p { font-size: 14px; opacity: 0.85; }
  .content { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
  .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
  .card h2 { font-size: 17px; color: #1a6b4a; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-item label { font-size: 12px; color: #888; display: block; margin-bottom: 3px; }
  .info-item span { font-size: 15px; font-weight: 600; }
  .progress-bar { height: 10px; background: #eee; border-radius: 10px; overflow: hidden; margin-top: 8px; }
  .progress-fill { height: 100%; background: #1a6b4a; border-radius: 10px; }
  .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .footer { text-align: center; color: #888; font-size: 12px; padding: 20px; }
</style>
</head>
<body>

<div class="header">
  <h1>🏗️ ${project.name}</h1>
  <p>דוח פרויקט – ${date}</p>
</div>

<div class="content">

  <div class="card">
    <h2>פרטי פרויקט</h2>
    <div class="info-grid">
      <div class="info-item"><label>לקוח</label><span>${project.clientName}</span></div>
      <div class="info-item"><label>טלפון</label><span>${project.clientPhone || '–'}</span></div>
      <div class="info-item"><label>עיר</label><span>${project.city || '–'}</span></div>
      <div class="info-item"><label>כתובת</label><span>${project.address || '–'}</span></div>
      <div class="info-item"><label>תקציב</label><span>₪${Number(project.budget).toLocaleString()}</span></div>
      <div class="info-item"><label>סטטוס</label><span>${statusLabel[project.status] || project.status}</span></div>
    </div>
    <div style="margin-top:16px">
      <label style="font-size:12px;color:#888">התקדמות</label>
      <div class="progress-bar"><div class="progress-fill" style="width:${project.progressPercent}%"></div></div>
      <p style="text-align:left;font-size:13px;color:#1a6b4a;margin-top:4px;font-weight:600">${project.progressPercent}%</p>
    </div>
  </div>

  ${materials.length > 0 ? `
  <div class="card">
    <h2>📦 חומרים (${materials.length})</h2>
    ${materialsHtml}
  </div>` : ''}

  ${images.length > 0 ? `
  <div class="card">
    <h2>📸 תמונות שטח (${images.length})</h2>
    <div class="photos-grid">${imagesHtml}</div>
  </div>` : ''}

  ${pdfs.length > 0 ? `
  <div class="card">
    <h2>📄 קבצי PDF (${pdfs.length})</h2>
    ${pdfsHtml}
  </div>` : ''}

</div>

<div class="footer">
  דוח זה נוצר אוטומטית · ${date}
</div>

</body>
</html>`;
    }
}