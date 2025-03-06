export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
}

export interface ChatKeys {
  publicKey: string;
  secretKey: string;
}
