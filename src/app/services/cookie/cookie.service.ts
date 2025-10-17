import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  /**
   * Définit un cookie avec les paramètres de sécurité appropriés
   * @param nom - Le nom du cookie
   * @param valeur - La valeur à stocker
   * @param joursExpiration - Nombre de jours avant expiration (optionnel)
   * @param dateExpiration - Date d'expiration précise (optionnel, prioritaire sur joursExpiration)
   */
  definirCookie(nom: string, valeur: string, joursExpiration?: number, dateExpiration?: Date): void {
    let cookie = `${nom}=${valeur}; path=/; SameSite=Strict`;
    
    // Ajouter le flag Secure si on est en HTTPS
    if (window.location.protocol === 'https:') {
      cookie += '; Secure';
    }
    
    // Utiliser la date d'expiration précise si fournie
    if (dateExpiration) {
      cookie += `; expires=${dateExpiration.toUTCString()}`;
    }
    // Sinon utiliser le nombre de jours si spécifié
    else if (joursExpiration) {
      const date = new Date();
      date.setTime(date.getTime() + (joursExpiration * 24 * 60 * 60 * 1000));
      cookie += `; expires=${date.toUTCString()}`;
    }
    // Si aucune expiration n'est définie, c'est un cookie de session
    
    document.cookie = cookie;
  }

  /**
   * Récupère la valeur d'un cookie par son nom
   * @param nom - Le nom du cookie à récupérer
   * @returns La valeur du cookie ou null si non trouvé
   */
  obtenirCookie(nom: string): string | null {
    const nomEgale = nom + '=';
    const cookiesDecoupes = document.cookie.split(';');
    
    for (let i = 0; i < cookiesDecoupes.length; i++) {
      let cookie = cookiesDecoupes[i].trim();
      
      if (cookie.indexOf(nomEgale) === 0) {
        return cookie.substring(nomEgale.length, cookie.length);
      }
    }
    
    return null;
  }

  /**
   * Supprime un cookie en définissant sa date d'expiration dans le passé
   * @param nom - Le nom du cookie à supprimer
   */
  supprimerCookie(nom: string): void {
    document.cookie = `${nom}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }

  /**
   * Vérifie si un cookie existe
   * @param nom - Le nom du cookie à vérifier
   * @returns true si le cookie existe, false sinon
   */
  cookieExiste(nom: string): boolean {
    return this.obtenirCookie(nom) !== null;
  }
}