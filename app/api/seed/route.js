import connectDB from "@/lib/database/db";
import Product from "@/models/Product";

export async function POST() {
    await connectDB();
   

    const products = await Product.insertMany([
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 349.99,
    description: "Industry-leading noise canceling headphones with 30-hour battery life and multipoint Bluetooth connection for two devices at once.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    category: "Electronics"
  },
  {
    name: "Apple iPad Air 11-inch (M2)",
    price: 599.99,
    description: "Supercharged by the M2 chip with a stunning Liquid Retina display. Compatible with Apple Pencil Pro and Magic Keyboard.",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    category: "Electronics"
  },
  {
    name: "Logitech MX Master 3S Mouse",
    price: 99.99,
    description: "Ergonomic wireless mouse with ultra-fast MagSpeed scrolling and an 8K DPI sensor that works on any surface including glass.",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
    category: "Electronics"
  },
  {
    name: "Samsung 65\" QLED 4K Smart TV",
    price: 1299.99,
    description: "Quantum Dot technology delivers over a billion shades of color. Object Tracking Sound+ and built-in Alexa included.",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=400",
    category: "Electronics"
  },
  {
    name: "Anker 737 Power Bank (24,000mAh)",
    price: 89.99,
    description: "High-capacity portable charger with 140W output. Charges a MacBook Pro, iPhone, and iPad simultaneously.",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
    category: "Electronics"
  },
  {
    name: "Levi's 501 Original Fit Jeans",
    price: 69.50,
    description: "The original straight-leg jean since 1873. Button fly, sits at the waist, made from 100% cotton denim.",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    category: "Clothing"
  },
  {
    name: "Nike Air Force 1 '07 Sneakers",
    price: 110.00,
    description: "Classic low-top sneaker with perforated toe for breathability and an Air-Sole unit for lightweight cushioning.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    category: "Clothing"
  },
  {
    name: "Patagonia Better Sweater Fleece Jacket",
    price: 139.00,
    description: "Made from 100% recycled polyester fleece with a sweater-like look. Features zippered hand pockets and a shockcord hem.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    category: "Clothing"
  },
  {
    name: "Uniqlo Ultra Light Down Jacket",
    price: 79.90,
    description: "Incredibly light and packable warmth with 90% premium down fill and a water-repellent outer shell. Packs into its own pocket.",
    image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=400",
    category: "Clothing"
  },
  {
    name: "Adidas Ultraboost 23 Running Shoes",
    price: 189.99,
    description: "Responsive BOOST midsole returns energy with every stride. Primeknit upper hugs the foot for a sock-like fit.",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
    category: "Clothing"
  },
  {
    name: "Instant Pot Duo 7-in-1 (6 Qt)",
    price: 89.95,
    description: "Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer all in one. 13 built-in programs.",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400",
    category: "Home & Kitchen"
  },
  {
    name: "KitchenAid Artisan Stand Mixer (5 Qt)",
    price: 449.99,
    description: "Iconic tilt-head stand mixer with 10 speeds and a 5-quart stainless steel bowl. Includes flat beater, dough hook, and wire whip.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
    category: "Home & Kitchen"
  },
  {
    name: "Nespresso Vertuo Next Coffee Machine",
    price: 179.00,
    description: "Brews five cup sizes from espresso to alto XL. Centrifusion technology spins capsules 7,000 times per minute for perfect crema.",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    category: "Home & Kitchen"
  },
  {
    name: "Cuisinart 12-Piece Stainless Cookware Set",
    price: 249.99,
    description: "Professional-grade stainless steel with aluminum encapsulated base for even heat distribution. Oven safe to 550°F.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    category: "Home & Kitchen"
  },
  {
    name: "Dyson V15 Detect Cordless Vacuum",
    price: 749.99,
    description: "Laser reveals hidden dust on hard floors. Acoustic piezo sensor counts particles in real time to prove a deep clean. 60-min run time.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    category: "Home & Kitchen"
  },
  {
    name: "Hydro Flask 32 oz Wide Mouth Bottle",
    price: 44.95,
    description: "TempShield double-wall vacuum insulation keeps drinks cold 24 hours and hot 12 hours. BPA-free 18/8 pro-grade stainless steel.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    category: "Sports & Outdoors"
  },
  {
    name: "Garmin Forerunner 265 GPS Watch",
    price: 449.99,
    description: "AMOLED display with full-color maps, daily suggested workouts, Training Readiness score, and HRV status tracking.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    category: "Sports & Outdoors"
  },
  {
    name: "Manduka PRO Yoga Mat (6mm)",
    price: 120.00,
    description: "Dense cushioning protects joints across all yoga styles. Closed-cell surface prevents moisture absorption. Backed by a lifetime guarantee.",
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400",
    category: "Sports & Outdoors"
  },
  {
    name: "Coleman Sundome 4-Person Tent",
    price: 89.99,
    description: "Sets up in 10 minutes. WeatherTec system with welded floors and inverted seams keeps you dry in rain. Fits one queen airbed.",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
    category: "Sports & Outdoors"
  },
  {
    name: "Atomic Habits by James Clear",
    price: 16.99,
    description: "A proven framework for building good habits and breaking bad ones through tiny, consistent changes that compound into remarkable results.",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    category: "Books"
  },
  {
    name: "The Psychology of Money by Morgan Housel",
    price: 14.99,
    description: "19 short stories about the strange ways people think about money, wealth, and happiness — timeless lessons that change how you invest.",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
    category: "Books"
  },
  {
    name: "Deep Work by Cal Newport",
    price: 15.99,
    description: "Rules for focused success in a distracted world. Newport argues that deep focus is the superpower of the 21st-century economy.",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    category: "Books"
  },
  {
    name: "LEGO Technic Land Rover Defender",
    price: 199.99,
    description: "2,573-piece authentic replica with working steering, opening doors, hood, and tailgate. Detailed interior. For ages 11 and up.",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
    category: "Toys & Games"
  },
  {
    name: "Catan Board Game (5th Edition)",
    price: 44.99,
    description: "The award-winning strategy game for 3-4 players. Trade resources, build settlements, and race to dominate the island of Catan.",
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400",
    category: "Toys & Games"
  },
  {
    name: "Nintendo Switch OLED Model",
    price: 349.99,
    description: "Vibrant 7-inch OLED screen, wide adjustable stand, 64GB internal storage, enhanced audio, and a dock with a wired LAN port.",
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400",
    category: "Toys & Games"
  },
  {
    name: "Dyson Airwrap Multi-Styler Complete",
    price: 599.99,
    description: "Styles and dries hair simultaneously without extreme heat. Uses the Coanda effect to curl, wave, smooth, and dry with 6 attachments.",
    image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400",
    category: "Beauty & Personal Care"
  },
  {
    name: "CeraVe Moisturizing Cream (19 oz)",
    price: 18.99,
    description: "Developed with dermatologists. Restores the skin's barrier with 3 essential ceramides. Provides 24-hour hydration for dry skin.",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    category: "Beauty & Personal Care"
  },
  {
    name: "KONG Classic Dog Toy (Large)",
    price: 14.99,
    description: "Durable natural rubber chew toy that bounces unpredictably for exciting fetch. Stuffable with treats for mentally stimulating solo play.",
    image: "https://images.unsplash.com/photo-1601758124096-519ed9b28d90?w=400",
    category: "Pet Supplies"
  },
  {
    name: "Furbo 360° Dog Camera with Treat Toss",
    price: 169.00,
    description: "Rotating camera lets you watch, talk, and toss treats to your dog remotely. Bark alerts sent straight to your phone. Alexa compatible.",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    category: "Pet Supplies"
  },
  {
    name: "Chemical Guys Car Wash Kit (8 Items)",
    price: 59.99,
    description: "Complete detailing bundle with snow foam soap, butter wax, interior cleaner, wash mitt, microfiber towels, and a detailing brush set.",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400",
    category: "Automotive"
  }
]);

    return Response.json({
        message: "Products seeded successfully",
        count: products.length,
    });

        }
    
