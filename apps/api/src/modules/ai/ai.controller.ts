import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

import { AiService } from './ai.service';
import {
  CreateBrandVoiceDto,
  HashtagsDto,
  OptimizeDto,
  RewriteDto,
  SummarizeDto,
  TranslateDto,
} from './dto/ai.dto';

@Controller('organizations/:orgSlug/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveOrgId(orgSlug: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org.id;
  }

  @Post('summarize')
  async summarize(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: SummarizeDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    const orgId = await this.resolveOrgId(orgSlug);
    const summary = await this.ai.summarizeConversation(
      dto.conversationId,
      orgId,
    );
    return { summary };
  }

  @Post('rewrite')
  async rewrite(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: RewriteDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    const orgId = await this.resolveOrgId(orgSlug);

    let brandVoice: {
      tone: string;
      examples: string[];
      instructions?: string | null;
    } | null = null;
    if (dto.brandVoiceId) {
      brandVoice = await this.prisma.brandVoice.findFirst({
        where: { id: dto.brandVoiceId, organizationId: orgId },
        select: { tone: true, examples: true, instructions: true },
      });
    }
    if (!brandVoice) {
      brandVoice = await this.prisma.brandVoice.findFirst({
        where: { organizationId: orgId, isDefault: true },
        select: { tone: true, examples: true, instructions: true },
      });
    }
    if (!brandVoice) {
      return { text: dto.text };
    }

    const text = await this.ai.rewriteWithBrandVoice(dto.text, brandVoice);
    return { text };
  }

  @Post('translate')
  async translate(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: TranslateDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    void orgSlug;
    const text = await this.ai.translateMessage(dto.text, dto.targetLanguage);
    return { text };
  }

  @Post('hashtags')
  async hashtags(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: HashtagsDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    void orgSlug;
    const hashtags = await this.ai.generateHashtags(dto.caption, dto.platform);
    return { hashtags };
  }

  @Post('optimize')
  async optimize(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: OptimizeDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    void orgSlug;
    const caption = await this.ai.optimizeForPlatform(
      dto.caption,
      dto.platform,
    );
    return { caption };
  }

  @Get('brand-voices')
  async listBrandVoices(@Param('orgSlug') orgSlug: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    return this.ai.listBrandVoices(orgId);
  }

  @Post('brand-voices')
  async createBrandVoice(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: CreateBrandVoiceDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    const orgId = await this.resolveOrgId(orgSlug);
    return this.ai.createBrandVoice(orgId, dto);
  }

  @Delete('brand-voices/:id')
  async deleteBrandVoice(
    @Param('orgSlug') orgSlug: string,
    @Param('id') id: string,
    @CurrentUser() _user: JwtPayload,
  ) {
    const orgId = await this.resolveOrgId(orgSlug);
    await this.ai.deleteBrandVoice(orgId, id);
    return { ok: true };
  }
}
