// controllers/geo.controller.ts (or wherever your controller lives)

import { getNearbyMobileShops } from "@/services/get-nearby.service";
import { ApiResponse } from "@/utils/apiResponse";

export class GeoLocatonController {
    /**
     * Fetch nearby mobile shops based on lat, lng, and optional radius.
     *
     * @param body Object containing lat and lng (required), radius (optional)
     * @returns ApiResponse with error if validation fails or the shops data on success
     */
    async getNearbyShops(body: any) {
        const { lat, lng, radius = 1500 } = body ?? {};
        // Validate inputs
        if (!lat || !lng) {
            return ApiResponse.error("Latitude and longitude are required cgxfghfg", 400);
        }
        try {
            // Fetch shops with optional radius
            const shops = await getNearbyMobileShops(lat, lng, radius);
            return ApiResponse.success(shops, 200);
        } catch (error: any) {
            console.error("Error in getNearbyShops:", error);
            return ApiResponse.error(error.message || "Failed to fetch nearby shops", 500);
        }
    }
}
