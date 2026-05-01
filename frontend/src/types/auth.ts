export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
