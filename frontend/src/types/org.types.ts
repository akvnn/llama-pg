export interface Organization {
  id: string;
  name: string;
  joined_at: string;
  role: string;
}

export interface OrganizationUser {
  user_id: string;
  username: string;
  role: string;
  joined_at: string;
}
