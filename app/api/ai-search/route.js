import OpenAI from 'openai';
import connectDB from '@/lib/database/db';
import {
    getFallbackProducts,
    searchFallbackProducts,
} from '@/lib/catalog/fallbackProducts';
import { resolveWithTimeout } from '@/lib/utils/resolveWithTimeout';
import Product from '@/models/Product';

function normalizeProducts(products) {
    return products.map((product) => ({
        ...product,
        _id: product._id?.toString?.() || product._id,
    }));
}

async function getCatalogProducts(category) {
    try {
        const products = await resolveWithTimeout(
            (async () => {
                await connectDB();
                const categoryFilter = category && category !== "All" ? { category } : {};
                return Product.find(categoryFilter).lean();
            })()
        );

        return products && products.length > 0
            ? normalizeProducts(products)
            : getFallbackProducts(category);
    } catch (error) {
        console.error("Unable to load MongoDB products for search.", error);
        return getFallbackProducts(category);
    }
}

function localSearch(products, query) {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
        return products;
    }

    return products.filter((product) =>
        [product.name, product.description, product.category]
            .join(" ")
            .toLowerCase()
            .includes(trimmedQuery)
    );
}

export async function POST(request) {
    const { query = "", category = "All" } = await request.json();
    const trimmedQuery = query.trim();
    const catalogProducts = await getCatalogProducts(category);

    if (!trimmedQuery) {
        return Response.json(catalogProducts);
    }

    if (!process.env.OPENAI_API_KEY) {
        const products = localSearch(catalogProducts, trimmedQuery);
        return Response.json(
            products.length > 0
                ? products
                : searchFallbackProducts(trimmedQuery, category)
        );
    }

    try {
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const aiResponse = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-5.2",
            messages: [
                {
                    role: "developer",
                    content: "Return only 1 to 4 concise ecommerce search keywords. No punctuation, no explanation.",
                },
                {
                    role: "user",
                    content: `Search request: ${trimmedQuery}`,
                },
            ],
        });

        const keyword = aiResponse.choices[0]?.message?.content?.trim() || trimmedQuery;
        const keywords = keyword
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 1);
        const searchTerms = keywords.length > 0 ? keywords : [trimmedQuery];

        const products = catalogProducts.filter((product) =>
            searchTerms.some((term) =>
                [product.name, product.description, product.category]
                    .join(" ")
                    .toLowerCase()
                    .includes(term.toLowerCase())
            )
        );

        return Response.json(
            products.length > 0
                ? products
                : localSearch(catalogProducts, trimmedQuery)
        );
    } catch (error) {
        console.error("AI search failed. Falling back to local product search.", error);
        return Response.json(localSearch(catalogProducts, trimmedQuery));
    }
}
