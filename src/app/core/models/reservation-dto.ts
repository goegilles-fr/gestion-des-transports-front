export interface ReservationVehiculeDto {
    id?: number;
    dateDebut: Date;
    dateFin: Date;
    utilisateurId?: number | null;
    vehiculeId: number;
}
