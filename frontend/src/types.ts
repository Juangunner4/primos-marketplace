export interface Notification {
  id: number;
  publicKey: string;
  message: string;
  read: boolean;
  createdAt: number;
}
