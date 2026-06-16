import { createAiClient, getAiModel } from '@/lib/ai/client';
import connectDB from '@/lib/database/db';
import Review from "@/models/Review";

export async function POST(request) {
  try {
    const aiClient = createAiClient();

    if (!aiClient) {
      return Response.json(
        { message: "AI API key is not defined" },
        { status: 503 }
      );
    }

    await connectDB();

    const { productId } = await request.json();

    const reviews = await Review.find({ productId });

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reviews found for this product." }),
        { status: 404 }
      );
    }

    const reviewText = reviews                      
      .slice(0, 50)                                
      .map((review, i) =>
        `Review ${i + 1}: ${review.comment || ""}. Rating: ${review.rating}/5`  
      )
      .join('\n');

    const aiResponse = await aiClient.chat.completions.create({
      model: process.env.AI_REVIEW_MODEL || getAiModel(), 
      messages: [
        {
          role: "system",                            
          content: "Summarize the following product reviews into a concise summary highlighting key points and overall sentiment. Focus on common themes, pros, cons, and any unique insights. Keep the summary under 100 words. Be objective and base it solely on the review content."
        },
        {
          role: "user",
          content: `Product Reviews:\n${reviewText}`
        }
      ]
    });

    const summary = aiResponse.choices[0].message.content;  
    console.log("Ai Review Summary", summary)

    return new Response(                        
      JSON.stringify({ summary }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in AI Review API:", error);
    return new Response(
      JSON.stringify({ message: "An error occurred while processing the request." }),
      { status: 500 }
    );
  }
}
