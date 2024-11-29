import * as sodium from "libsodium-wrappers";

export class ClientEncryption {
  private static async initSodium() {
    await sodium.ready;
    return sodium;
  }

  static async generateKeyPair() {
    const sodium = await this.initSodium();
    const keyPair = sodium.crypto_box_keypair();
    return {
      publicKey: sodium.to_base64(keyPair.publicKey),
      secretKey: sodium.to_base64(keyPair.privateKey),
    };
  }

  static async encryptMessage(
    senderSecretKey: string,
    recipientPublicKey: string,
    message: string,
  ) {
    const sodium = await this.initSodium();

    try {
      const messageBytes = sodium.from_string(message);

      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

      const secretKeyBytes = sodium.from_base64(senderSecretKey);
      const publicKeyBytes = sodium.from_base64(recipientPublicKey);

      const encryptedBytes = sodium.crypto_box_easy(
        messageBytes,
        nonce,
        publicKeyBytes,
        secretKeyBytes,
      );

      const encryptedBase64 = sodium.to_base64(encryptedBytes);
      const nonceBase64 = sodium.to_base64(nonce);

      return {
        encryptedMessage: encryptedBase64,
        nonce: nonceBase64,
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error(`Failed to encrypt message:`);
    }
  }

  static async decryptMessage(
    recipientSecretKey: string,
    senderPublicKey: string,
    encryptedMessage: string,
    nonce: string,
  ): Promise<string> {
    const sodium = await this.initSodium();

    try {
      const secretKeyBytes = sodium.from_base64(recipientSecretKey);
      const publicKeyBytes = sodium.from_base64(senderPublicKey);
      const messageBytes = sodium.from_base64(encryptedMessage);
      const nonceBytes = sodium.from_base64(nonce);

      const decryptedBytes = sodium.crypto_box_open_easy(
        messageBytes,
        nonceBytes,
        publicKeyBytes,
        secretKeyBytes,
      );

      return sodium.to_string(decryptedBytes);
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error(`Failed to decrypt message:`);
    }
  }
}
