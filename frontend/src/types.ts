export interface Notification {
  id: number;
  publicKey: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface AppMessage {
  text: string;
  type?: 'info' | 'success' | 'error';
}
