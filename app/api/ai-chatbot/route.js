import OpenAi from 'openai';

export async function POST(request){
    try{
        const query = req.body();
        if(!query){
            return Response.json({
                message: "Required Query",
            }, {status: 400})
        }

    }catch(error){
        return Response.json({
            message : "Error found in operating the request "
        },{status: 400})
    }
}