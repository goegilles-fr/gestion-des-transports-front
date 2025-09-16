import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour typer vos données
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adresse: {
    numero: number;
    libelle: string;
    codePostal: string;
    ville: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // URL de l'API
  private baseUrl = 'https://dev.goegilles.fr/api/auth';

  constructor(private http: HttpClient) {}

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, loginData);
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    console.log(registerData);
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, registerData);
  }
}
