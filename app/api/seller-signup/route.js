import connectDB from "@/lib/database/db";
import { hashPassword } from "@/lib/auth/password";
import SellerInfo from "@/models/SellerInfo";

const PHONE_NUMBER_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTRATION_TYPES = new Set(["pan", "vat", "company", "other"]);
const SELLER_TYPES = new Set(["individual", "business", "company"]);

export async function POST(request) {
  try {
    const body = await request.json();
    const normalizedSeller = normalizeSellerPayload(body);
    const validationError = validateSellerPayload(normalizedSeller, body);

    if (validationError) {
      return Response.json({ message: validationError }, { status: 400 });
    }

    await connectDB();

    const existingSeller = await SellerInfo.findOne({
      $or: [
        { email: normalizedSeller.email },
        { phoneNumber: normalizedSeller.phoneNumber },
        { "legalInfo.panOrVatNumber": normalizedSeller.legalInfo.panOrVatNumber },
        { "legalInfo.registrationNumber": normalizedSeller.legalInfo.registrationNumber },
      ],
    }).lean();

    if (existingSeller) {
      return Response.json(
        { message: getDuplicateSellerMessage(existingSeller, normalizedSeller) },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(body.password));

    const seller = await SellerInfo.create({
      ...normalizedSeller,
      passwordHash,
      verificationStatus: "submitted",
    });

    return Response.json(
      {
        message: "Seller registered successfully",
        seller: {
          id: seller._id,
          fullName: seller.fullName,
          email: seller.email,
          phoneNumber: seller.phoneNumber,
          sellerType: seller.sellerType,
          status: seller.status,
          verificationStatus: seller.verificationStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seller signup failed:", error);

    if (error?.code === 11000) {
      return Response.json(
        { message: "Seller already exists with one of the provided details" },
        { status: 409 }
      );
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

function normalizeSellerPayload(body) {
  return {
    fullName: normalizeText(body.ownerName),
    phoneNumber: normalizePhoneNumber(body.phoneNumber),
    email: normalizeEmail(body.email),
    sellerType: normalizeSellerType(body.sellerType),
    govNumber: normalizeText(body.citizenshipNumber),
    personalAddress: normalizeText(body.personalAddress),
    shop: {
      shopName: normalizeText(body.shopName),
      legalShopName: normalizeText(body.businessName),
      shopAddress: normalizeText(body.businessAddress),
      warehouseAddress: normalizeText(body.warehouseAddress),
      returnAddress: normalizeText(body.returnAddress),
      mainProductCategory: normalizeText(body.category),
    },
    legalInfo: {
      panOrVatNumber: normalizeText(body.taxNumber),
      registrationNumber: normalizeText(body.registrationNumber),
      registrationType: normalizeRegistrationType(body.registrationType) || "other",
    },
    bankDetails: {
      bankName: normalizeText(body.bankName)?.toUpperCase(),
      accountHolderName: normalizeText(body.accountHolder)?.toUpperCase(),
      bankAccountNumber: normalizeText(body.accountNumber),
      bankBranch: normalizeText(body.bankBranch),
    },
    liveInventory: normalizeInventory(body.monthlyProducts),
  };
}

function validateSellerPayload(seller, body) {
  if (!seller.fullName) return "Owner name is required";
  if (!seller.phoneNumber) return "Phone number is required";
  if (!PHONE_NUMBER_REGEX.test(seller.phoneNumber)) {
    return "Phone number must be 10 digits";
  }

  if (!seller.email) return "Email is required";
  if (!EMAIL_REGEX.test(seller.email)) return "Enter a valid email address";

  if (!seller.sellerType) return "Seller type is required";
  if (!SELLER_TYPES.has(String(body.sellerType || "").trim().toLowerCase())) {
    return "Seller type is invalid";
  }

  if (!seller.govNumber) return "Citizenship number is required";
  if (!seller.personalAddress) return "Personal address is required";
  if (!seller.shop.shopName) return "Shop name is required";
  if (!seller.shop.legalShopName) return "Business name is required";
  if (!seller.shop.shopAddress) return "Business address is required";
  if (!seller.shop.warehouseAddress) return "Warehouse address is required";
  if (!seller.shop.returnAddress) return "Return address is required";
  if (!seller.shop.mainProductCategory) return "Category is required";
  if (seller.liveInventory === null) {
    return "Estimated live products must be a valid number";
  }

  if (!seller.legalInfo.panOrVatNumber) return "Tax number is required";
  if (!seller.legalInfo.registrationNumber) {
    return "Registration number is required";
  }
  if (!REGISTRATION_TYPES.has(seller.legalInfo.registrationType)) {
    return "Registration type is invalid";
  }

  if (!seller.bankDetails.bankName) return "Bank name is required";
  if (!seller.bankDetails.accountHolderName) {
    return "Account holder is required";
  }
  if (!seller.bankDetails.bankAccountNumber) {
    return "Account number is required";
  }
  if (!seller.bankDetails.bankBranch) return "Bank branch is required";

  return validatePassword(body.password, body.confirmPassword);
}

function validatePassword(password, confirmPassword) {
  if (typeof password !== "string" || !password) {
    return "Password is required";
  }

  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return "Confirm password is required";
  }

  if (password !== confirmPassword) {
    return "Password and confirm password do not match";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function normalizeEmail(value) {
  const email = normalizeText(value);
  return email?.toLowerCase();
}

function normalizePhoneNumber(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const digitsOnly = String(value).replace(/\D/g, "");
  return digitsOnly || undefined;
}

function normalizeSellerType(value) {
  const normalizedValue = normalizeText(value)?.toLowerCase();

  if (normalizedValue === "business") {
    return "company";
  }

  return normalizedValue;
}

function normalizeRegistrationType(value) {
  return normalizeText(value)?.toLowerCase();
}

function normalizeInventory(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function getDuplicateSellerMessage(existingSeller, normalizedSeller) {
  if (existingSeller.email === normalizedSeller.email) {
    return "A seller with this email already exists";
  }

  if (existingSeller.phoneNumber === normalizedSeller.phoneNumber) {
    return "A seller with this phone number already exists";
  }

  if (
    existingSeller.legalInfo?.panOrVatNumber ===
    normalizedSeller.legalInfo.panOrVatNumber
  ) {
    return "A seller with this tax number already exists";
  }

  if (
    existingSeller.legalInfo?.registrationNumber ===
    normalizedSeller.legalInfo.registrationNumber
  ) {
    return "A seller with this registration number already exists";
  }

  return "Seller already exists";
}
