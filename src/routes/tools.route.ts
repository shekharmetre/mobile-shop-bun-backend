import { Tools } from '@/controllers/tools.controller';
import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

const toolsFunction = new Tools();

export const tools = new Elysia({ prefix: '/test' })
    .use(
        cors({
            origin: [
                'https://www.bhagyawantimobile.shop',
                'http://localhost:3000',
                'https://f52719b20371.ngrok-free.app/',
            ],
            credentials: true,
        })
    )
    .get('/get-district', async ({ query }) => {
        return toolsFunction.getDistrict(query);
    })
