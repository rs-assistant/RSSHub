import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { getRouteLimit } from '@/utils/route-limit';
import parser from '@/utils/rss-parser';
import { parseDate } from '@/utils/time';

import { BASE_URL } from './common';

export const route: Route = {
    path: '/news/company-announcements',
    categories: ['programming'],
    example: '/openai/news/company-announcements',
    radar: [
        {
            source: ['openai.com/news/company-announcements'],
            target: '/news/company-announcements',
        },
    ],
    name: 'Company Announcements',
    maintainers: ['goestav', 'StevenRCE0', 'nczitzk'],
    handler: async (ctx) => {
        const xml = await ofetch(new URL('/news/rss.xml', BASE_URL).href, { responseType: 'text' });
        const feed = await parser.parseString(xml);
        const items = feed.items.filter((item) => item.categories?.includes('Company'));

        return {
            title: 'OpenAI Company Announcements',
            link: new URL('/news/company-announcements/', BASE_URL).href,
            item: items.slice(0, getRouteLimit(ctx, 10)).map((item) => ({
                title: item.title || item.link || item.guid || 'Untitled',
                link: item.link,
                guid: item.guid,
                description: item.content || item.description || item.summary,
                category: item.categories,
                pubDate: item.pubDate ? parseDate(item.pubDate) : undefined,
            })),
        };
    },
};
