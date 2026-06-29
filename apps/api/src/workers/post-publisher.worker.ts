import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PostStatus } from '@velion/types';

import { PrismaService } from '../prisma/prisma.service';
import { ConnectorFactory } from '../modules/connectors/connector.factory';
import { ConnectedAccountsService } from '../modules/connectors/connected-accounts.service';
import { POST_PUBLISHER_QUEUE } from '../modules/publishing/publishing.service';

interface PublishJobData {
  postId: string;
}

@Processor(POST_PUBLISHER_QUEUE, { concurrency: 5 })
export class PostPublisherWorker extends WorkerHost {
  private readonly logger = new Logger(PostPublisherWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly connectedAccounts: ConnectedAccountsService,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<void> {
    const { postId } = job.data;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { media: { orderBy: { order: 'asc' } } },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found — skipping`);
      return;
    }

    if (post.status === PostStatus.PUBLISHED) {
      this.logger.debug(`Post ${postId} already published — skipping`);
      return;
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    try {
      const account = await this.connectedAccounts.getDecryptedAccountById(
        post.connectedAccountId,
      );
      const connector = this.connectorFactory.getConnector(account.platform);

      const result = await connector.publishPost(
        account,
        post.caption ?? '',
        post.media.map((m) => m.url),
        post.metadata as Record<string, unknown>,
      );

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl ?? null,
          errorMessage: null,
        },
      });

      this.logger.log(
        `Post ${postId} published successfully on ${account.platform}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to publish post ${postId}: ${message}`);

      await this.prisma.post.update({
        where: { id: postId },
        data: { status: PostStatus.FAILED, errorMessage: message },
      });

      throw err;
    }
  }
}
