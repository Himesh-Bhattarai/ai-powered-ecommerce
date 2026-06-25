

// POST ORDER REQUEST
export async function POST(request) {
  try {
    const { productId, quantity } = await request.json().catch(() => ({}));

    const orderQuantity = Number(quantity);

    // Validate body
    if (!productId || !Number.isInteger(orderQuantity) || orderQuantity <= 0) {
      return NextResponse.json(
        { message: "Valid productId and quantity are required" },
        { status: 400 }
      );
    }

    // Check token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenResult = verifyToken(accessToken);

    if (!tokenResult.valid || !tokenResult.decoded?._id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Check user exists
    const user = await User.findById(tokenResult.decoded._id).select("_id");

    if (!user) {
      return NextResponse.json(
        { message: "User account not found" },
        { status: 401 }
      );
    }

    // Atomic stock update
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        quantity: { $gte: orderQuantity },
      },
      {
        $inc: { quantity: -orderQuantity },
      },
      {
        new: true,
      }
    ).select("_id quantity price title");

    if (!product) {
      return NextResponse.json(
        { message: "Product not found or insufficient stock" },
        { status: 400 }
      );
    }

    // Create order
    const order = await Order.create({
      user: user._id,
      product: product._id,
      quantity: orderQuantity,
    });

    return NextResponse.json(
      {
        message: "Order placed successfully",
        data: {
          _id: order._id.toString(),
          user: order.user.toString(),
          product: order.product.toString(),
          quantity: order.quantity,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}


//GET order details history or current

export async function GET(){
    try{
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if(!accessToken){
            return NextResponse.json({
                message : "Authentication required",
                
            }, {status : 401})
        }

        const tokenResult = verifyToken(accessToken);

        if(!tokenResult.valid || !tokenResult.decoded?._id){
            return NextResponse.json({
                message : "Authentication required",
            }, {status : 401})
        }

        await connectDB();

        //check user exist or not
        const user = await User.findById(tokenResult.decoded._id).select("_id");

        if(!user){
            return NextResponse.json({
                message : "User account not found",
            }, {status : 401})
        }

        // if user found then find his order history and current order
        const orders = await Order.find({ userId : user._id})

        // normalize data
        const normalizedOrders = orders.map((order) => ({
            _id : order._id.toString(),
            user : order.user.toString(),
            product : order.product.toString(),
            quantity : order.quantity,
            createdAt : order.createdAt,
        }));

        return NextResponse.json({
            message : "Order history",
            data : normalizedOrders,
        }, {status : 200})

    }catch(error){
        console.error("Get order error:", error);
        return NextResponse.json({
            message : "Something went wrong",
        }, {status : 500})
       
    }
}

// 
