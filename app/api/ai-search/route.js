import { createAiClient, getAiModel } from '@/lib/ai/client';
import connectDB from '@/lib/database/db';
import Product from '@/models/Product';

const SEARCH_STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "for",
    "me",
    "please",
    "show",
    "find",
    "search",
    "shop",
    "buy",
    "product",
    "products",
    "item",
    "items",
]);

function normalizeProducts(products) {
    return products.map((product) => ({
        ...product,
        _id: product._id?.toString?.() || product._id,
    }));
}

async function getCatalogProducts(category) {
    await connectDB();

    const categoryFilter = category && category !== "All" ? { category } : {};
    const products = await Product.find(categoryFilter).lean();

    return normalizeProducts(products);
}

function localSearch(products, query) {
    const trimmedQuery = String(query ?? "").trim().toLowerCase();

    if (!trimmedQuery) {
        return products;
    }

    const searchTerms = trimmedQuery
        .split(/[^a-z0-9]+/i)
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
    const fallbackTerms = searchTerms.length > 0 ? searchTerms : [trimmedQuery];

    return products.filter((product) =>
        [product.name, product.description, product.category]
            .join(" ")
            .toLowerCase()
            .includes(trimmedQuery) ||
        fallbackTerms.some((term) =>
            [product.name, product.description, product.category]
                .join(" ")
                .toLowerCase()
                .includes(term)
        )
    );
}

export async function POST(request) {
    try {
        const { query = "", category = "All" } = await request.json();
        const trimmedQuery = String(query ?? "").trim();
        const catalogProducts = await getCatalogProducts(String(category || "All"));

        if (!trimmedQuery) {
            return Response.json(catalogProducts);
        }

        const client = createAiClient();

        if (!client) {
            return Response.json(localSearch(catalogProducts, trimmedQuery));
        }

        let keyword = trimmedQuery;

        try {
            const aiResponse = await client.chat.completions.create({
                model: process.env.AI_SEARCH_MODEL || getAiModel(),
                messages: [
                    {
                        role: "system",
                        content: "Return only 1 to 4 concise ecommerce search keywords. No punctuation, no explanation.",
                    },
                    {
                        role: "user",
                        content: `Search request: ${trimmedQuery}`,
                    },
                ],
            });

            keyword = aiResponse.choices[0]?.message?.content?.trim() || trimmedQuery;
            console.log("AI search keyword:", keyword);
        } catch (error) {
            console.warn("AI search provider failed. Falling back to local product search.", {
                status: error?.status,
                message: error?.message,
            });
            return Response.json(localSearch(catalogProducts, trimmedQuery));
        }

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
        console.error("AI search failed.", error);
        return Response.json(
            { message: "Search failed" },
            { status: 500 }
        );
    }
}
