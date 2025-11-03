export interface User {
  id: string;
  username: string;
}

export interface ServiceAccount {
  user_id: string;
  username: string;
  role: string;
  joined_at: string;
}
