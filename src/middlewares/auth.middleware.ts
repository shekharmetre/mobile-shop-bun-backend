import type { Context } from 'elysia';
import { ApiResponse } from '../utils/apiResponse';
import { verifySupabaseToken } from '../utils/helper';
import { AuthUser } from '..';

export const ssoMiddleware = async ({ request, set, store }: Context) => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  console.log("🔑 Token received:", token);

  if (!token) {
    set.status = 401;
    return ApiResponse.error("🔒 Token not found", 401);
  }

  // ✅ Await the verification
  const result = await verifySupabaseToken(token);

  if (!result.user || result.error) {
    set.status = 401;
    return ApiResponse.error(result.error || 'User not found', 401);
  }
  // ✅ Save the user in the store
  store.user = {
    email: result.user.email,
    userId : result.user.sub
  } as AuthUser;

  set.status = 200;
};
