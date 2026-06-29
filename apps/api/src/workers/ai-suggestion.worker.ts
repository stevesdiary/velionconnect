import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../modules/ai/ai.service';
import { RealtimeGateway } from '../gateways/realtime.gateway';
import { AI_SUGGESTION_QUEUE } from '../modules/ai/ai.module';

interface AiSuggestionJobData {
  messageId: string;
  conversationId: string;
  organizationId: string;
  workspaceId: string | null;
}

@Processor(AI_SUGGESTION_QUEUE, { concurrency: 3 })
export class AiSuggestionWorker extends WorkerHost {
  private readonly logger = new Logger(AiSuggestionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly gateway: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<AiSuggestionJobData>): Promise<void> {
    const { messageId, conversationId, organizationId, workspaceId } = job.data;

    try {
      const suggestions = await this.ai.generateReplySuggestions(
        conversationId,
        organizationId,
      );
      if (suggestions.length === 0) return;

      await this.prisma.aIMessageSuggestion.createMany({
        data: suggestions.map((s, i) => ({
          messageId,
          suggestion: s,
          confidence: 1 - i * 0.05,
        })),
        skipDuplicates: true,
      });

      const room = workspaceId
        ? `workspace:${workspaceId}`
        : `org:${organizationId}`;
      this.gateway.emitToWorkspace(
        workspaceId ?? organizationId,
        'suggestion:ready',
        { messageId, conversationId, suggestions },
      );
      void room;

      this.logger.debug(`Suggestions ready for message ${messageId}`);
    } catch (err) {
      this.logger.warn(
        `AI suggestion failed for message ${messageId}: ${String(err)}`,
      );
    }
  }
}
