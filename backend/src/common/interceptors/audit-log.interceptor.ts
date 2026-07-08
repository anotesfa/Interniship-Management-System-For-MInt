import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from '../../activity-log/activity-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;
    const originalUrl = (request.originalUrl || request.url || '').split('?')[0];

    const shouldSkip =
      !request.user?.userId ||
      originalUrl.includes('/activity-logs') ||
      originalUrl.includes('/api/docs');

    return next.handle().pipe(
      tap(() => {
        if (shouldSkip) {
          return;
        }

        const routePath = originalUrl.replace(/^\/api\/v1\//, '').replace(/^\//, '');
        const [firstSegment, secondSegment] = routePath.split('/');
        const entityType = firstSegment || undefined;
        const entityId = Number.parseInt(secondSegment ?? '', 10);

        void this.activityLogService.log(
          request.user.userId,
          `${method.toUpperCase()} ${routePath}`,
          entityType,
          Number.isFinite(entityId) ? entityId : undefined,
          request.ip,
        );
      }),
    );
  }
}