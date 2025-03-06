export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  encryptedMessage?: string;
  senderPublicKey?: string;
  recipientPublicKey?: string;
  nonce?: string;
  createdAt: Date;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface EncryptedMessage extends Message {
  encryptedMessage: string;
  nonce: string;
  senderPublicKey: string;
}

export interface ChatKeys {
  publicKey: string;
  secretKey: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}
