export interface UserBase {
  email: string;
  full_name: string;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserResponse extends UserBase {
  id: string; // UUID → string
  created_at: string; // datetime → string (ISO 8601)
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
