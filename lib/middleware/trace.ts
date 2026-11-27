import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';

import { config } from '@/config';
import { tracer } from '@/utils/otel';

const middleware: MiddlewareHandler = async (ctx, next) => {
    if (config.debugInfo && config.debugInfo !== 'false') {
        // Only enable tracing in debug mode
        const { method } = ctx.req;
        const path = routePath(ctx, -1);

        const span = tracer.startSpan(`${method} ${path}`, {
            kind: 1, // server
            attributes: {},
        });
        span.addEvent('invoking handleRequest');
        await next();
        span.end();
    } else {
        // Skip
        await next();
    }
};

export default middleware;
