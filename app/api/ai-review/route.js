import mongoose from "mongoose";
import { createAiClient, getAiModel } from "@/lib/ai/client";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import Review from "@/models/Review";

const MAX_REVIEW_EXCERPTS = 50;

function clampRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return 0;
  }

  return Math.max(1, Math.min(5, rating));
}

function buildRatingBreakdown(reviews) {
  const counts = new Map([1, 2, 3, 4, 5].map((stars) => [stars, 0]));

  reviews.forEach((review) => {
    const stars = Math.round(clampRating(review.rating));
    counts.set(stars, (counts.get(stars) || 0) + 1);
  });

  return [5, 4, 3, 2, 1].map((stars) => {
    const count = counts.get(stars) || 0;
    const percent =
      reviews.length === 0 ? 0 : Math.round((count / reviews.length) * 100);

    return { stars, count, percent };
  });
}

function normalizeString(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function normalizeStringArray(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeSentiment(value, averageRating) {
  const sentiment = typeof value === "string" ? value.toLowerCase().trim() : "";

  if (["positive", "mixed", "negative"].includes(sentiment)) {
    return sentiment;
  }

  if (averageRating >= 4) return "positive";
  if (averageRating >= 3) return "mixed";
  return "negative";
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    try {
      const match = String(value || "").match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
}

function buildReviewText(reviews) {
  return reviews
    .slice(0, MAX_REVIEW_EXCERPTS)
    .map((review, index) => {
      const rating = clampRating(review.rating);
      const comment = review.comment || "No written comment.";

      return `Review ${index + 1}: Rating ${rating}/5. Comment: ${comment}`;
    })
    .join("\n");
}

function buildSummary(aiData, { averageRating, reviewCount, breakdown }) {
  const aiRating = clampRating(aiData?.aiRating || averageRating);
  const generatedAt = new Date();

  return {
    headline: normalizeString(aiData?.headline, "Review summary"),
    overview: normalizeString(
      aiData?.overview,
      "Customers have shared feedback for this product. Review the pros and cons for the main buying signals."
    ),
    pros: normalizeStringArray(aiData?.pros),
    cons: normalizeStringArray(aiData?.cons),
    sentiment: normalizeSentiment(aiData?.sentiment, averageRating),
    aiRating: Number(aiRating.toFixed(1)),
    averageRating,
    reviewCount,
    breakdown,
    generatedAt,
  };
}

export async function POST(request) {
  try {
    const aiClient = createAiClient();

    if (!aiClient) {
      return Response.json(
        { message: "AI API key is not defined" },
        { status: 503 }
      );
    }

    const { productId } = await request.json().catch(() => ({}));

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return Response.json(
        { message: "Valid productId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(productId).lean();

    if (!product) {
      return Response.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const reviews = await Review.find({ productId }).limit(MAX_REVIEW_EXCERPTS).lean();

    if (!reviews || reviews.length === 0) {
      return Response.json(
        { message: "No reviews found for this product." },
        { status: 404 }
      );
    }

    const reviewCount = reviews.length;
    const ratingTotal = reviews.reduce(
      (total, review) => total + clampRating(review.rating),
      0
    );
    const averageRating = Number((ratingTotal / reviewCount).toFixed(1));
    const breakdown = buildRatingBreakdown(reviews);
    const reviewText = buildReviewText(reviews);

    const aiResponse = await aiClient.chat.completions.create({
      model: process.env.AI_REVIEW_MODEL || getAiModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze ecommerce product reviews. Return only raw JSON with this schema: {\"headline\":\"short headline\",\"overview\":\"objective summary under 100 words\",\"pros\":[\"short pro\"],\"cons\":[\"short con\"],\"sentiment\":\"positive|mixed|negative\",\"aiRating\":4.5}. Base the answer only on the provided reviews.",
        },
        {
          role: "user",
          content: `Product: ${product.name}
Category: ${product.category}
Average rating: ${averageRating}/5
Review count: ${reviewCount}

Reviews:
${reviewText}`,
        },
      ],
      temperature: 0.3,
    });

    const aiContent = aiResponse.choices[0]?.message?.content;
    const aiData = safeJsonParse(aiContent);

    if (!aiData) {
      return Response.json(
        { message: "AI provider returned an invalid review summary" },
        { status: 502 }
      );
    }

    const aiReviewSummary = buildSummary(aiData, {
      averageRating,
      reviewCount,
      breakdown,
    });

    await Product.findByIdAndUpdate(
      productId,
      { $set: { aiReviewSummary } },
      { runValidators: true }
    );

    return Response.json({
      productId,
      aiReviewSummary,
    });
  } catch (error) {
    console.error("Error in AI Review API:", {
      status: error?.status,
      message: error?.message,
    });

    if (error?.status) {
      return Response.json(
        {
          message: "AI provider request failed",
          status: error.status,
        },
        { status: error.status === 429 ? 503 : 502 }
      );
    }

    return Response.json(
      { message: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}
