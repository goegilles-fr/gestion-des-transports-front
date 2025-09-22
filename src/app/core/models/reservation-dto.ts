export interface ReservationVehiculeDto {
    id?: number;
    dateDebut: string;
    dateFin: string;
    utilisateurId?: number | null;
    vehiculeId: number;
}
