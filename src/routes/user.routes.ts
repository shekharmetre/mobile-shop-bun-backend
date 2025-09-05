// src/routes/user.ts
import { Elysia, t } from 'elysia'
import { UserController } from '../controllers/user.controller'
import { PaymentController } from '../controllers/payment.controller'
import { db } from '../config/database'
import { safeQuery } from '../utils/safequery'
import { verifyPaymentToken, verifySupabaseToken } from '../utils/helper'
import { ApiResponse } from '../utils/apiResponse'
import { ssoMiddleware } from '../middlewares/auth.middleware'
import { Tools } from '@/controllers/tools.controller'
import cors from '@elysiajs/cors'

const userControl = new UserController()
const paymentControler = new PaymentController()
const tools = new Tools()

export const userRoutes = new Elysia({ prefix: '/user' })
  // .use(cors({
  //   origin: [
  //     'https://www.bhagyawantimobile.shop',  // ✅ correct production frontend
  //     'http://localhost:3000',
  //     'https://5445-2401-4900-93a5-69e5-71b2-141a-6639-447f.ngrok-free.app'
  //   ],
  //   credentials: true
  // }))
  .post(
    '/register',
    async ({ body, set }) => {
      return await userControl.registerUser(body, set)
    },
  )
  .post(
    '/login',
    async ({ query, body, set }) => {
      const route = query.redirect || '/'
      return await userControl.loginUser(body, set, route)
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post('/payment/success', async ({ body, set, query }) => {
    const { token } = query
    if (!token) {
      return ApiResponse.error("token not found", 401)
    }
    return await paymentControler.paymentSuccess(body, set, token)
  })

  // 🔐 Protected Routes (use auth middleware here only)
  .group('', (app) =>
    app.use(cors())
      .get('/token-verify', (ctx: any) => {
        const authHeader = ctx.headers['authorization'] || ctx.headers['Authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
          ctx.set.status = 401;
          return ApiResponse.error('Token missing', 401);
        }

        const result = verifySupabaseToken(token);

        if (!result.user || result.error) {
          ctx.set.status = 401;
          return ApiResponse.error(result.error || 'User not found', 401);
        }

        return ApiResponse.success(result.user);
      }, {
        beforeHandle: ssoMiddleware
      })
      .post('/auth/payment', async ({ body, set,store }) => {
        // console.log("store data",store.user.email,body)
        // ApiResponse.success("sucessfuolly u enered here",200)
        return await paymentControler.initPayment(body, set,store)
      }, {
        beforeHandle: ssoMiddleware
      })
      .post('/auth/dummy/payment', async ({ body, set }) => {
        return await paymentControler.dummyOne(body, set)
      })
      .post("/selected-shop", async ({ body, set }) => {
        return await tools.getselectedShopId(body)
      })
      .post(
        '/verify-payment',
        async ({ body, set }) => {
          const { token } = body
          if (!token) return ApiResponse.error('Token is missing', 400)

          const verified = verifyPaymentToken(token)
          if (!verified) return ApiResponse.error('Invalid or expired token', 401)
          if (!verified.txnid) return ApiResponse.error('Invalid transaction ID')

          const orderDetail = await safeQuery(() =>
            db.order.findUnique({ where: { txnId: verified.txnid } })
          )
          if (!orderDetail) return ApiResponse.error('Order not found')

          return ApiResponse.success({ user: orderDetail })
        },
        {
          body: t.Object({ token: t.String() }),
        }
      )
  )
