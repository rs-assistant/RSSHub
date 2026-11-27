import type { MiddlewareHandler } from 'hono';

import { config } from '@/config';
import RejectError from '@/errors/types/reject';
import { consumeWeiboOAuthState, hasValidAccessCredential } from '@/utils/weibo-oauth';

const reject = () => {
    throw new RejectError('Authentication failed. Access denied.');
};

const middleware: MiddlewareHandler = async (ctx, next) => {
    const requestPath = new URL(ctx.req.url).pathname;

    if (['/', '/robots.txt', '/favicon.ico', '/logo.png'].includes(requestPath)) {
        await next();
        return;
    }

    const protectedRequest = config.requireAccessKey || !!config.accessKey;
    if (protectedRequest) {
        ctx.header('Cache-Control', 'private, no-store');
        ctx.header('Referrer-Policy', 'no-referrer');
    }

    if (config.requireAccessKey && !config.accessKey) {
        return reject();
    }
    if (!hasValidAccessCredential(ctx)) {
        if (requestPath !== '/weibo/timeline/0' || !ctx.req.query('code')) {
            return reject();
        }
        const state = await consumeWeiboOAuthState(ctx.req.query('state'));
        if (!state) {
            return reject();
        }
        ctx.set('weiboOAuthState', state);
    }

    await next();
    if (protectedRequest) {
        ctx.header('Cache-Control', 'private, no-store');
    }
};

export default middleware;
