export async function POST(request){
    try{
        const { query = "" } = await request.json();

        if(!query){
            return Response.json({
                message: "Required Query",
            }, {status: 400})
        }

        return Response.json({
            reply: "I can help you find products. Frontend chatbot integration is ready.",
            query,
        });

    }catch(error){
        console.error("AI chatbot route error:", error);
        return Response.json({
            message : "Error found in operating the request "
        },{status: 400})
    }
}
