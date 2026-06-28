import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './material.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class MaterialsService {
    constructor(@InjectRepository(Material) private repo: Repository<Material>) { }

    findAll(ownerId: string) {
        return this.repo.find({ where: { ownerId }, order: { name: 'ASC' } });
    }

    findByProject(projectId: string, ownerId: string) {
        return this.repo.find({ where: { projectId, ownerId }, order: { name: 'ASC' } });
    }

    findByApartment(apartmentId: string, ownerId: string) {
        return this.repo.find({ where: { apartmentId, ownerId }, order: { name: 'ASC' } });
    }

    async findOne(id: string, ownerId: string) {
        const m = await this.repo.findOne({ where: { id, ownerId } });
        if (!m) throw new NotFoundException('חומר לא נמצא');
        return m;
    }

    create(data: Partial<Material>, ownerId: string) {
        const m = this.repo.create({ ...data, ownerId });
        return this.repo.save(m);
    }

    async update(id: string, data: Partial<Material>, ownerId: string) {
        await this.findOne(id, ownerId);
        await this.repo.update(id, data);
        return this.findOne(id, ownerId);
    }

    async remove(id: string, ownerId: string) {
        const m = await this.findOne(id, ownerId);
        await this.repo.remove(m);
        return { message: 'חומר נמחק' };
    }

    getLowStock(ownerId: string) {
        return this.repo
            .createQueryBuilder('m')
            .where('m.ownerId = :ownerId', { ownerId })
            .andWhere('m.quantity <= m.minQuantity')
            .getMany();
    }

    async adjustQuantity(id: string, ownerId: string, delta: number) {
        const m = await this.findOne(id, ownerId);
        m.quantity = Number(m.quantity) + delta;
        return this.repo.save(m);
    }

    async updateDeliveryStatus(id: string, ownerId: string, status: string, notes?: string, imageUrl?: string) {
        await this.findOne(id, ownerId);
        const updateData: any = { deliveryStatus: status };
        if (notes) updateData.deliveryNotes = notes;
        if (imageUrl) updateData.deliveryImageUrl = imageUrl;
        await this.repo.update(id, updateData);
        return this.findOne(id, ownerId);
    }
}

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
    constructor(private materialsService: MaterialsService) { }

    @Get()
    findAll(
        @Request() req,
        @Query('projectId') projectId?: string,
        @Query('apartmentId') apartmentId?: string,
    ) {
        if (apartmentId) return this.materialsService.findByApartment(apartmentId, req.user.id);
        if (projectId) return this.materialsService.findByProject(projectId, req.user.id);
        return this.materialsService.findAll(req.user.id);
    }

    @Get('low-stock')
    getLowStock(@Request() req) { return this.materialsService.getLowStock(req.user.id); }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.materialsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Body() body: any, @Request() req) {
        return this.materialsService.create(body, req.user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req) {
        return this.materialsService.update(id, body, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.materialsService.remove(id, req.user.id);
    }

    @Post(':id/adjust')
    adjust(@Param('id') id: string, @Body() body: { delta: number }, @Request() req) {
        return this.materialsService.adjustQuantity(id, req.user.id, body.delta);
    }

    @Patch(':id/delivery')
    updateDelivery(
        @Param('id') id: string,
        @Body() body: { status: string; notes?: string; imageUrl?: string },
        @Request() req,
    ) {
        return this.materialsService.updateDeliveryStatus(id, req.user.id, body.status, body.notes, body.imageUrl);
    }
}

@Module({
    imports: [TypeOrmModule.forFeature([Material])],
    providers: [MaterialsService],
    controllers: [MaterialsController],
    exports: [MaterialsService],
})
export class MaterialsModule { }