import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import { PrismaService } from '../../prisma/prisma.service';

const SONNET = 'claude-sonnet-4-6';
const HAIKU = 'claude-haiku-4-5-20251001';

export interface BrandVoiceData {
  tone: string;
  examples: string[];
  instructions?: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ai.anthropicApiKey') ?? '',
    });
  }

  async generateReplySuggestions(
    conversationId: string,
    orgId: string,
  ): Promise<string[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: { direction: true, content: true, sentAt: true },
    });

    if (messages.length === 0) return [];

    const knowledgeBases = await this.prisma.aIKnowledgeBase.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { name: true, content: true },
    });

    const brandVoice = await this.prisma.brandVoice.findFirst({
      where: { organizationId: orgId, isDefault: true },
      select: { tone: true, examples: true, instructions: true },
    });

    const conversationContext = messages
      .reverse()
      .map(
        (m: { direction: string; content: string | null }) =>
          `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content ?? '[media]'}`,
      )
      .join('\n');

    const knowledgeContext = knowledgeBases.length
      ? `\n\nKnowledge base:\n${knowledgeBases.map((kb: { name: string; content: string }) => `${kb.name}: ${kb.content}`).join('\n\n')}`
      : '';

    const voiceContext = brandVoice
      ? `\n\nBrand voice: ${brandVoice.tone}. ${brandVoice.instructions ?? ''}\nExamples: ${brandVoice.examples.join(' | ')}`
      : '';

    const prompt = `You are a customer support assistant. Based on this conversation, suggest 3 short reply options for the agent. Return ONLY a JSON array of 3 strings, nothing else.

Conversation:
${conversationContext}${knowledgeContext}${voiceContext}

Suggestions (JSON array of 3 strings):`;

    try {
      const response = await this.client.messages.create({
        model: SONNET,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const text =
        response.content[0]?.type === 'text' ? response.content[0].text : '[]';
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        return parsed.slice(0, 3) as string[];
      }
    } catch (err) {
      this.logger.warn(`Reply suggestion failed: ${String(err)}`);
    }

    return [];
  }

  async summarizeConversation(
    conversationId: string,
    orgId: string,
  ): Promise<string> {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId, deletedAt: null },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { sentAt: 'asc' },
          select: { direction: true, content: true },
        },
      },
    });

    if (!conv) return '';

    const transcript = conv.messages
      .map(
        (m: { direction: string; content: string | null }) =>
          `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content ?? '[media]'}`,
      )
      .join('\n');

    try {
      const response = await this.client.messages.create({
        model: SONNET,
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Summarize this customer support conversation in 2-3 sentences, focusing on the issue and resolution status:\n\n${transcript}`,
          },
        ],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : '';
    } catch (err) {
      this.logger.warn(`Summarization failed: ${String(err)}`);
      return '';
    }
  }

  async rewriteWithBrandVoice(
    text: string,
    brandVoice: BrandVoiceData,
  ): Promise<string> {
    const prompt = `Rewrite the following message in this brand voice: ${brandVoice.tone}. ${brandVoice.instructions ?? ''}
Examples of this voice: ${brandVoice.examples.join(' | ')}

Original: ${text}

Rewritten (return ONLY the rewritten text):`;

    try {
      const response = await this.client.messages.create({
        model: HAIKU,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : text;
    } catch (err) {
      this.logger.warn(`Brand voice rewrite failed: ${String(err)}`);
      return text;
    }
  }

  async translateMessage(
    text: string,
    targetLanguage: string,
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: HAIKU,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Translate the following text to ${targetLanguage}. Return ONLY the translated text:\n\n${text}`,
          },
        ],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : text;
    } catch (err) {
      this.logger.warn(`Translation failed: ${String(err)}`);
      return text;
    }
  }

  async generateHashtags(caption: string, platform: string): Promise<string[]> {
    const prompt = `Generate 5-10 relevant hashtags for this ${platform} post. Return ONLY a JSON array of strings (with # prefix), nothing else:\n\n${caption}`;

    try {
      const response = await this.client.messages.create({
        model: HAIKU,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const text =
        response.content[0]?.type === 'text' ? response.content[0].text : '[]';
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        return parsed as string[];
      }
    } catch (err) {
      this.logger.warn(`Hashtag generation failed: ${String(err)}`);
    }

    return [];
  }

  async optimizeForPlatform(
    caption: string,
    platform: string,
  ): Promise<string> {
    const constraints: Record<string, string> = {
      TWITTER: 'Under 280 characters. Punchy and direct.',
      INSTAGRAM:
        'Engaging and visual. Use emojis sparingly. 2-3 short paragraphs.',
      LINKEDIN: 'Professional tone. Add value. 3-5 sentences.',
      FACEBOOK: 'Conversational and friendly. Can be longer.',
      TIKTOK: 'Very short, punchy, use trending language.',
      WHATSAPP: 'Conversational and personal. Keep it brief.',
    };

    const guidance =
      constraints[platform.toUpperCase()] ?? 'Keep it concise and engaging.';

    try {
      const response = await this.client.messages.create({
        model: HAIKU,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Rewrite this caption optimized for ${platform}. ${guidance}\n\nOriginal: ${caption}\n\nOptimized (return ONLY the rewritten caption):`,
          },
        ],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : caption;
    } catch (err) {
      this.logger.warn(`Platform optimization failed: ${String(err)}`);
      return caption;
    }
  }

  async listBrandVoices(orgId: string) {
    return this.prisma.brandVoice.findMany({
      where: { organizationId: orgId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createBrandVoice(
    orgId: string,
    data: {
      name: string;
      tone: string;
      examples: string[];
      instructions?: string;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.brandVoice.updateMany({
        where: { organizationId: orgId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.brandVoice.create({
      data: { ...data, organizationId: orgId },
    });
  }

  async deleteBrandVoice(orgId: string, id: string) {
    await this.prisma.brandVoice.deleteMany({
      where: { id, organizationId: orgId },
    });
  }
}
