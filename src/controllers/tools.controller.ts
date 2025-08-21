

import { ApiResponse } from "@/utils/apiResponse";

export class Tools {
    async getDistrict(query: { lat?: string; lng?: string; radius?: string }) {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${query.lat},${query.lng}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return ApiResponse.error({ district: null }, 404)
        }

        const components = data.results[0].address_components;

        const districtComponent = components.find((comp: any) =>
            comp.types.includes("administrative_area_level_2") ||
            comp.types.includes("locality") ||
            comp.types.includes("sublocality")
        );
        return ApiResponse.success({ district: districtComponent?.long_name ?? null }, 200)
    }
    async getselectedShopId(body: any) {
        return ApiResponse.success("SUccduslf swe get", 200)
    }

}