import crypto from "crypto";

const ACCESS_TOKEN_SECONDS = 60 * 60 * 2;
const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 7;

const getSecretKey = () => {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("JWT_SECRET_KEY is not defined");
  }

  return secretKey;
};

const base64Url = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const signToken = (payload, expiresInSeconds) => {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const body = base64Url({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
};

export const generateToken = (payload) => {
  const accessToken = signToken(payload, ACCESS_TOKEN_SECONDS);
  const refreshToken = signToken(payload, REFRESH_TOKEN_SECONDS);

  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  try {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) {
      return { valid: false, decoded: null };
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(`${header}.${body}`)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return { valid: false, decoded: null };
    }

    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, decoded: null };
    }

    return { valid: true, decoded };
  } catch (error) {
    console.log(error.message);
    return { valid: false, decoded: null };
  }
};

export const refreshToken = (token) => {
  try {
    const { valid, decoded } = verifyToken(token);

    if (!valid || !decoded) {
      return null;
    }

    const newAccessToken = signToken({ id: decoded.id, email: decoded.email }, ACCESS_TOKEN_SECONDS);

    return { accessToken: newAccessToken };
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
