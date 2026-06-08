import crypto from "crypto";

const KEY_LENGTH = 64;

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

export const verifyPassword = (password, storedPassword) => {
  const [algorithm, salt, storedHash] = storedPassword.split(":");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const hashedBuffer = Buffer.from(storedHash, "hex");

      if (hashedBuffer.length !== derivedKey.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(hashedBuffer, derivedKey));
    });
  });
};
