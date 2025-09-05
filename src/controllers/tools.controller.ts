

import { gnereateObject } from "@/config/Aiintegration";
import { prisma } from "@/config/database";

import { supabase } from "@/config/supbase";
import { ApiResponse } from "@/utils/apiResponse";
import { parseJavaScriptObjectFromCodeBlock } from "@/utils/helper";


//           const prompt = `
// Generate a JavaScript object ONLY (no extra text or explanation) with random realistic values. 
// Do not wrap it in quotes, return just the object literal.  

// Rules:
// - Extract the product name from the given image URL filename (e.g. "normal-cable-v8" → "Normal Cable V8").  
// - The object must have these fields:
//   - id: string (random unique id)
//   - name: string (from image filename, formatted nicely)
//   - description: string (short, realistic product description)
//   - price: number (random realistic price)
//   - discountPrice?: number (optional, lower than price)
//   - images: string[] (include the given image URL and optionally duplicates or variants)
//   - category: string (general category, e.g., enum Category {
//   chargers
//   cables
//   audio
//   protection
//   accessories
//   adapters
//   gaming
//   mobile
//   sim
//   powerbanks
// })
//   - subcategory: string (specific subcategory, e.g., "Cables")
//   - compatibility?: string[] (optional, e.g., ["Android", "iPhone"])
//   - features?: string[] (optional, e.g., ["Durable", "Fast Charging"])
//   - rating: number (between 1 and 5, allow decimals)
//   - reviews: number (realistic count, e.g., 10–500)
//   - inStock: boolean
//   - isNew?: boolean
//   - isFeatured?: boolean
//   - isLatest?: boolean

// Image URL to use:  
// ${imageUrl}
//           `;

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
    async getBucketLists(body: any) {
        const { bucket, prompt, fucntionText } = body;

        try {
            const response = await supabase.storage.from(bucket).list("", {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "desc" },
            });

            if (response.error) {
                console.error("Error listing files:", response.error);
                return ApiResponse.error(response.error.message, 404);
            }

            // No files case
            if (!response.data || response.data.length === 0) {
                return ApiResponse.success([], 200);
            }

            // Process each file (limited to first 2 for now)
            const objects = await Promise.all(
                response.data.map(async (file) => {
                    try {
                        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(file.name);
                        const imageUrl = publicUrlData?.publicUrl;

                        if (!imageUrl) {
                            throw new Error(`Could not generate public URL for file: ${file.name}`);
                        }


                        const output = await gnereateObject(prompt); // ✅ fixed typo
                        const cleanedObject = parseJavaScriptObjectFromCodeBlock(output);

                        console.log("Parsed object:", cleanedObject);

                        if (!cleanedObject || typeof cleanedObject !== "object") {
                            console.error("Invalid object parsed from AI output:", output);
                            return null;
                        }

                        // For now just return the object (DB insert is commented)
                        const createdProduct = await prisma.product.create({
                            data: {
                                ...cleanedObject
                            }
                        });

                        console.log(createdProduct, "succesfully saved on dtabase")

                        return cleanedObject;
                    } catch (err) {
                        console.error(`Error processing file ${file.name}:`, err);
                        return null; // skip problematic files
                    }
                })
            );

            const validObjects = objects.filter((obj) => obj !== null);

            console.log("Success objects:", validObjects);
            return ApiResponse.success(validObjects, 200);
        } catch (error) {
            console.error("Unexpected error in getBucketLists:", error);
            return ApiResponse.error(error.message || "Server error", 500);
        }
    }

}

// so this is a prompt

// Given the product name and image URL below, provide a JavaScript object with these fields: 
// id (string), name (string), description (string), price (number), discountPrice (optional number), 
// images (array of strings), category (string), subcategory (string), compatibility (array of strings, optional), 
// features (array of strings, optional), rating (number), reviews (number), inStock (boolean), and boolean flags 
// isNew, isFeatured, isLatest (all optional).

// Use realistic placeholder values and include the image URL in the images array.

// Product Name: "Aux Cable"
// Image URL: "https://tsvoqnwwdslkzjlpgmkv.supabase.co/storage/v1/object/public/product-data/aux-cable.jpg"

// Return only the JavaScript object, without any extra text, explanation, or variable declarations.
