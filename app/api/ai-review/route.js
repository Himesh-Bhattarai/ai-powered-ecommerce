import OpenAI from 'openai';
import connectDB from '@/lib/database/db';
import Review from "@/models/Review";

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { message: "OPENAI_API_KEY is not defined" },
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
        `Review ${i + 1}: ${review.content}. Rating: ${review.rating}/5`  
      )
      .join('\n');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const aiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o", 
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
