import { Tools } from '@/controllers/tools.controller';
import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

const toolsFunction = new Tools();

export const tools = new Elysia({ prefix: '/test' })
    .get('/get-district', async ({ query }) => {
        return toolsFunction.getDistrict(query);
    })
    .post("/get-bucket", async ({ body }) => {
        return toolsFunction.getBucketLists(body)
    })