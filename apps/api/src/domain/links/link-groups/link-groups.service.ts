import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CacheManager } from '../../../core/cache/cache.manager';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { CreateLinkGroupDto, UpdateLinkGroupDto } from './dto';

@Injectable()
export class LinkGroupsService {
  constructor(
    private prisma: PrismaService,
    private readonly cacheManager: CacheManager,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  private async invalidateProfileCache(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { username: true },
    });
    if (!profile?.username) return;
    const username = profile.username;
    await this.cacheManager.invalidate(`profile:username:${username}`);
    await this.cacheManager.invalidate(`profile:username:v2:${username}`);
    await this.cacheManager.invalidate(`profile:username:v3:${username}`);
    await this.cacheManager.invalidate(`profile:username:v4:${username}`);
    await this.cacheManager.invalidate(`profile:username:v5:${username}`);
  }

  async create(userId: string, createDto: CreateLinkGroupDto) {
    const limit = await this.subscriptions.checkLimit(userId, 'linkGroups');
    if (!limit.allowed) {
      throw new ForbiddenException(
        'وصلت إلى حد مجموعات الروابط في خطتك الحالية. رقِّ خطتك لإضافة المزيد.',
      );
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const maxOrder = await this.prisma.linkGroup.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const linkGroup = await this.prisma.linkGroup.create({
      data: {
        name: createDto.name,
        nameAr: createDto.nameAr,
        color: createDto.color || '#6366f1',
        icon: createDto.icon,
        isExpanded: createDto.isExpanded ?? true,
        profileId: profile.id,
        order: maxOrder ? maxOrder.order + 1 : 0,
      },
    });

    await this.invalidateProfileCache(userId);
    return linkGroup;
  }

  async findAll(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const groups = await this.prisma.linkGroup.findMany({
      where: { profileId: profile.id },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { links: true },
        },
      },
    });

    return groups.map((group) => ({
      ...group,
      linksCount: group._count.links,
    }));
  }

  async findOne(userId: string, id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const group = await this.prisma.linkGroup.findFirst({
      where: {
        id,
        profileId: profile.id,
      },
      include: {
        links: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Link group not found');
    }

    return group;
  }

  async update(userId: string, id: string, updateDto: UpdateLinkGroupDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const group = await this.prisma.linkGroup.findFirst({
      where: {
        id,
        profileId: profile.id,
      },
    });

    if (!group) {
      throw new NotFoundException('Link group not found');
    }

    const updatedGroup = await this.prisma.linkGroup.update({
      where: { id },
      data: updateDto,
    });

    await this.invalidateProfileCache(userId);
    return updatedGroup;
  }

  async remove(userId: string, id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const group = await this.prisma.linkGroup.findFirst({
      where: {
        id,
        profileId: profile.id,
      },
    });

    if (!group) {
      throw new NotFoundException('Link group not found');
    }

    await this.prisma.socialLink.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await this.prisma.linkGroup.delete({
      where: { id },
    });

    await this.invalidateProfileCache(userId);
    return { message: 'Link group deleted successfully' };
  }
}
