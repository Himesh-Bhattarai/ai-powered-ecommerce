import OpenAI from "openai";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    await connectDB();

    const { productId } = await request.json();

    if (!productId) {
      return Response.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return Response.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const prompt = `You are a product expert for an e-commerce marketplace.

Given this product:
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price}
- Description: ${product.description}

Generate exactly 10 questions a real buyer would ask before purchasing this product.
Focus on: compatibility, battery/power, sizing, warranty, materials, usage limits.
Keep answers concise, factual, and helpful — 2-3 sentences max.

Respond ONLY with raw JSON, no markdown, no explanation:
{
  "faqs": [
    { "question": "...", "answer": "..." }
  ]
}`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",   // cheaper + fast enough for this
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const aiData = JSON.parse(aiResponse.choices[0].message.content);

    // save FAQs directly onto the product document
    await Product.findByIdAndUpdate(productId, {
      faqs: aiData.faqs
    });

    return Response.json(
      { message: "FAQs generated successfully", faqs: aiData.faqs },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
