import OpenAI from "openai";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import UserIntent from "@/models/UserIntent";

const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Sports & Outdoors",
    "Books",
    "Toys & Games",
    "Beauty & Personal Care",
    "Pet Supplies",
    "Automotive",
];

export async function POST(request) {
    try {
        const { userId, signal, signals } = await request.json();
        const incomingSignals = Array.isArray(signals) ? signals : signal ? [signal] : [];
        const currentSignals = incomingSignals
            .map((item) => ({
                type: String(item.type || "").trim(),
                value: String(item.value || "").trim(),
                createdAt: new Date(),
            }))
            .filter((item) => item.type && item.value);

        if (currentSignals.length === 0) {
            return Response.json(
                { message: "Send at least one signal" },
                { status: 400 }
            );
        }

        await connectDB();

        let signalsForAi = currentSignals;

        if (userId) {
            await UserIntent.findOneAndUpdate(
                { userId },
                {
                    $push: {
                        signals: {
                            $each: currentSignals,
                            $slice: -50,
                        },
                    },
                },
                { upsert: true }
            );

            const savedIntent = await UserIntent.findOne({ userId }).lean();
            signalsForAi = (savedIntent?.signals || currentSignals).slice(-30);
        }

        if (!process.env.OPENAI_API_KEY) {
            return Response.json(
                { message: "OPENAI_API_KEY is not defined" },
                { status: 500 }
            );
        }

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `
You are a shopping intent classifier for an ecommerce store.

Use these shopping signals:
${signalsForAi.map((item) => `- ${item.type}: "${item.value}"`).join("\n")}

Return JSON only:
{
  "persona": "short user shopping intent",
  "keywords": ["3 to 6 product keywords"],
  "category": "one of: ${CATEGORIES.join(", ")}",
  "bundles": [
    { "title": "topic bundle title", "query": "product search query", "category": "category" }
  ]
}
        `;

        const aiResponse = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: prompt }],
            temperature: 0.4,
            max_tokens: 300,
        });

        let intent = {};

        try {
            intent = JSON.parse(aiResponse.choices[0]?.message?.content || "{}");
        } catch {
            intent = {};
        }

        const persona = String(intent.persona || "personalized shopper").trim();
        const keywords = Array.isArray(intent.keywords)
            ? intent.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
            : signalsForAi.flatMap((item) => item.value.split(/\s+/)).slice(0, 6);
        const category = CATEGORIES.includes(intent.category) ? intent.category : "";
        const bundles = Array.isArray(intent.bundles)
            ? intent.bundles.slice(0, 3).map((item) => ({
                title: String(item.title || "Recommended for you").trim(),
                query: String(item.query || keywords.join(" ")).trim(),
                category: CATEGORIES.includes(item.category) ? item.category : category,
            }))
            : [];

        const searchTerms = keywords.length ? keywords : [persona];
        const productFilter = {
            ...(category ? { category } : {}),
            $or: searchTerms.flatMap((term) => {
                const regex = new RegExp(term, "i");

                return [
                    { name: regex },
                    { description: regex },
                    { category: regex },
                ];
            }),
        };

        let products = await Product.find(productFilter).limit(12).lean();

        if (products.length === 0 && category) {
            products = await Product.find({ category }).limit(12).lean();
        }

        if (userId) {
            await UserIntent.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        persona,
                        keywords,
                        category,
                        bundles,
                    },
                }
            );
        }

        return Response.json({
            saved: Boolean(userId),
            userId: userId || null,
            signalCount: signalsForAi.length,
            persona,
            keywords,
            category: category || null,
            bundles,
            products: products.map((product) => ({
                ...product,
                _id: product._id.toString(),
            })),
        });
    } catch (error) {
        console.error("Error in AI Intent API:", error);

        return Response.json(
            { message: "An error occurred while processing the request." },
            { status: 500 }
        );
    }
}
