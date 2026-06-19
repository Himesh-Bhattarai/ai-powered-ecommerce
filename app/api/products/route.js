import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import verifyToken from "@/models/jwt";
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().lean();

    return Response.json(
      products.map((product) => ({
        ...product,
        _id: product._id.toString(),
      }))
    );
  } catch (error) {
    console.error("Unable to load MongoDB products.", error);
    return Response.json(
      { message: "Unable to load products" },
      { status: 500 }
    );
  }
}


export async function POST() {
  try {
    const cookieStore = await cookie();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({
        message: "Authentication required"
      },
        { status: 401 })
    }

    //verify token
    const { valid, decoded } = verifyToken(accessToken);

    if (!valid || !decoded?.id) {
      return Response.json({
        message: "Authentication required"
      },
        { status: 401 })
    }

    await connectDB();

    const { name, category, price, stock, description, image } = await request.json();

    // validate feilds
    if (!name || !category || !price || !stock || !description || !image) {
      return Response.json({
        message: "All fields are required"
      },
        { status: 400 })
    }

    // check seller in databse
    const seller = await SellerInfo.findById(decoded?.id).select("fullName email phoneNumber sellerType status verificationStatus shop");

    if (!seller) {
      return Response.json({
        message: "Seller not found"
      }, { status: 401 })
      
    }
    
    
          // create An product 
          const product = await Product.create({
            seller: seller._id,
            name,
            category,
            price,
            stock,
            description,
            image
          });

          return Response.json({
            message : "Product sucessfully createď",
            product : product,
          })



  }catch(error){
    console.error("Product route error:", error);
    return Response.json({
      message : "Error found in operating the request "
    },{status: 400})
  }
}