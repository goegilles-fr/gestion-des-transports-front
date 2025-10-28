import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StatutVehicule, VehiculeDTO } from '../../core/models/vehicule-dto';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReservationVehiculeDto } from '../../core/models/reservation-dto';

@Injectable({
  providedIn: 'root'
})
export class Vehicules {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl.replace(/\/$/, '');
  private urlPerso = `${this.base}/vehicules-personnels`;
  private urlEntreprise = `${this.base}/vehicules-entreprise`;
  private urlReservation = `${this.base}/reservations-vehicules`;

  loading = signal(false);

  // ========================= PERSONNEL ===========================

  listPerso(): Observable<VehiculeDTO[]> {
    return this.http.get<VehiculeDTO[]>(`${this.urlPerso}`);
  }

  getPerso(id: number): Observable<VehiculeDTO> {
    return this.http.get<VehiculeDTO>(`${this.urlPerso}/${id}`);
  }

  getPersoByUserId(): Observable<VehiculeDTO[]> {
    return this.http.get<VehiculeDTO[]>(`${this.urlPerso}/utilisateur`);
  }

  createPerso(payload: Omit<VehiculeDTO, 'id' | 'utilisateurId'>): Observable<VehiculeDTO> {
    return this.http.post<VehiculeDTO>(`${this.urlPerso}`, payload);
  }

  updatePerso(payload: Partial<VehiculeDTO>): Observable<VehiculeDTO> {
    return this.http.put<VehiculeDTO>(`${this.urlPerso}`, payload);
  }

  deletePerso(): Observable<void> {
    return this.http.delete<void>(`${this.urlPerso}`);
  }

  // ========================= ENTREPRISE ===========================

  listEntreprise(): Observable<VehiculeDTO[]> {
    return this.http.get<VehiculeDTO[]>(`${this.urlEntreprise}`);
  }

  getEntreprise(id: number): Observable<VehiculeDTO> {
    return this.http.get<VehiculeDTO>(`${this.urlEntreprise}/${id}`);
  }

  getEntrepriseByStatut(statut: StatutVehicule): Observable<VehiculeDTO[]> {
    return this.http.get<VehiculeDTO[]>(`${this.urlEntreprise}/statut/${statut}`);
  }

  getEntrepriseByDate(dateDebut: string, dateFin: string): Observable<VehiculeDTO[]> {
    return this.http.get<VehiculeDTO[]>(`${this.urlEntreprise}/dispo?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  }

  createEntreprise(payload: Omit<VehiculeDTO, 'id' | 'utilisateurId'>): Observable<VehiculeDTO> {
    return this.http.post<VehiculeDTO>(`${this.urlEntreprise}`, payload);
  }

  updateEntreprise(id: number, payload: Partial<VehiculeDTO>): Observable<VehiculeDTO> {
    return this.http.put<VehiculeDTO>(`${this.urlEntreprise}/${id}`, payload);
  }

  deleteEntreprise(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlEntreprise}/${id}`);
  }

  // ========================= Reservation Vehicule ===========================

  getAllReservation(): Observable<ReservationVehiculeDto[]> {
    return this.http.get<ReservationVehiculeDto[]>(`${this.urlReservation}`);
  }

  listReservationByUserId(): Observable<ReservationVehiculeDto[]> {
    return this.http.get<ReservationVehiculeDto[]>(`${this.urlReservation}/utilisateur`);
  }

  createReservation(payload: Omit<ReservationVehiculeDto, 'id' | 'utilisateurId'>): Observable<ReservationVehiculeDto> {
    return this.http.post<ReservationVehiculeDto>(`${this.urlReservation}`, payload);
  }

  updateReservation(id: number, payload: Partial<ReservationVehiculeDto>): Observable<ReservationVehiculeDto> {
    return this.http.put<ReservationVehiculeDto>(`${this.urlReservation}/${id}`, payload);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlReservation}/${id}`);
  }
}
