import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private repo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private itemRepo: Repository<InvoiceItem>,
  ) {}

  findAll(ownerId: string) {
    return this.repo.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
      relations: { items: true },
    });
  }

  async findOne(id: string, ownerId: string) {
    const inv = await this.repo.findOne({ where: { id, ownerId }, relations: { items: true } });
    if (!inv) throw new NotFoundException('חשבונית לא נמצאה');
    return inv;
  }

  async create(data: any, ownerId: string) {
    const count = await this.repo.count({ where: { ownerId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const { items: rawItems, ...invoiceData } = data;
    const rawItemsArr = rawItems || [];

    const subtotal = rawItemsArr.reduce((sum: number, item: any) =>
      sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
    const taxAmount = subtotal * ((Number(data.taxPercent) || 17) / 100);
    const total = subtotal + taxAmount;

    // Save invoice first to get its ID
    const invoice = this.repo.create({
      ...invoiceData,
      invoiceNumber,
      ownerId,
      subtotal,
      taxAmount,
      total,
      issueDate: data.issueDate || new Date(),
    });
    const saved = await this.repo.save(invoice);

    // Save items with explicit invoiceId
    if (rawItemsArr.length > 0) {
      const items = rawItemsArr.map((item: any) => this.itemRepo.create({
        invoiceId: saved.id,
        description: item.description || '-',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      }));
      await this.itemRepo.save(items);
    }

    return this.findOne(saved.id, ownerId);
  }

  async update(id: string, data: Partial<Invoice>, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.repo.update(id, data);
    return this.findOne(id, ownerId);
  }

  async markPaid(id: string, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.repo.update(id, { status: InvoiceStatus.PAID, paidDate: new Date() as any });
    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    const inv = await this.findOne(id, ownerId);
    await this.repo.remove(inv);
    return { message: 'חשבונית נמחקה' };
  }

  async getSummary(ownerId: string) {
    const invoices = await this.findAll(ownerId);
    const paid = invoices.filter((i) => i.status === 'paid');
    const pending = invoices.filter((i) => i.status === 'sent');
    const overdue = invoices.filter((i) => i.status === 'overdue');
    return {
      totalRevenue: paid.reduce((s, i) => s + Number(i.total), 0),
      pendingAmount: pending.reduce((s, i) => s + Number(i.total), 0),
      overdueAmount: overdue.reduce((s, i) => s + Number(i.total), 0),
      counts: { total: invoices.length, paid: paid.length, pending: pending.length, overdue: overdue.length },
    };
  }
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(@Request() req) { return this.invoicesService.findAll(req.user.id); }

  @Get('summary')
  getSummary(@Request() req) { return this.invoicesService.getSummary(req.user.id); }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.invoicesService.create(body, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.invoicesService.update(id, body, req.user.id);
  }

  @Post(':id/mark-paid')
  markPaid(@Param('id') id: string, @Request() req) {
    return this.invoicesService.markPaid(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
