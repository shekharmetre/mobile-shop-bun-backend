import { GeoLocatonController } from "@/controllers/geo.controller";
import { ApiResponse } from "@/utils/apiResponse";
import cors from "@elysiajs/cors";
import Elysia from "elysia";

const geoLocationControllers = new GeoLocatonController();

interface ShopRequestBody {
  lat: string | number;
  lng: string | number;
  radius?: string | number;  // optional if your controller accepts it optionally
}

export const geoRoutes = new Elysia({ prefix: '/geo/api' })
  .use(
    cors({
      origin: [
        'https://www.bhagyawantimobile.shop',
        'http://localhost:3000',
        'https://951d5a76cac0.ngrok-free.app',
      ],
      credentials: true,
    })
  )
  .post(
    '/shops',
    async ({ body, set,request }) => {
      console.log(request.body,request.formData,"this is a bacns sstucvuter")
      return await geoLocationControllers.getNearbyShops(body)
    },
)

// Export this to be used in your main Elysia app