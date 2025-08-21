import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import cookie from '@elysiajs/cookie';
import "dotenv/config";

import { userRoutes } from './routes/user.routes';
import { protectedRoutes } from './routes/protete.routes';
import { testApis } from './routes/test.routes';
import { geoRoutes } from './routes/geo.routes';
import { tools } from './routes/tools.route';
import { errorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/apiResponse';

// ---- Define your AuthUser type ----
export interface AuthUser {
  email: string;
  userId : string;
}

const app = new Elysia()
  // ✅ This adds `user` to store and makes it typed everywhere
  .state('user', undefined as AuthUser | undefined)

  // Plugins
  .use(cookie())
  .use(cors({
    origin: [
      'https://www.bhagyawantimobile.shop',
      'http://localhost:8080',
      'https://5445-2401-4900-93a5-69e5-71b2-141a-6639-447f.ngrok-free.app',
      'https://462527683919.ngrok-free.app',
      'http://localhost:3000'
    ],
    credentials: true
  }))
  .use(errorHandler)
  .use(userRoutes)
  .use(protectedRoutes)
  .use(testApis)
  .use(geoRoutes)
  .use(tools)

  // ✅ Derive a global getter for user
  .derive({ as: 'global' }, ({ store }) => ({
    get user() {
      return store.user;
    }
  }))

  // Test route
  .get('/', ({ user }) => {
    if (user) {
      return ApiResponse.success(`Hello ${user.email}`);
    }
    return ApiResponse.success("Hello Guest");
  })

  // Global error handler
  .onError(({ code, error }) => {
    console.error('Global Error Handler:');
    console.error('Code:', code);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
  });

// ---- Start Server ----
const port = process.env.PORT || 8080;
app.listen(port);
console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
