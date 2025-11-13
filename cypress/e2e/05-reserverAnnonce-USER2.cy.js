describe('Covoit - Test réservation sur annonce existante', () => {
  it('devrait se connecter avec USER2 et réserver une place sur l\'annonce de USER1', () => {
    // Connexion avec USER2
    cy.visit('/login')
    
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL2'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD2'))
    cy.get('button.submit-btn').click()
    
    cy.wait(1000)
    
    // Naviguer vers la page de recherche de covoiturages
    cy.visit('/reservations/rechercher')
    
    // Remplir les critères de recherche correspondant à l'annonce créée par USER1
    
    // Ville de départ - Montpellier (taper directement sans utiliser l'autocomplete)
    cy.get('app-autocomplete-ville').first().find('input.autocomplete-input').type('Montpellier')
    
    // Ville d'arrivée - Nîmes (taper directement sans utiliser l'autocomplete)
    cy.get('app-autocomplete-ville').last().find('input.autocomplete-input').type('Nîmes')
    
    // Date de départ (demain - même date que l'annonce créée)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(dateString)
    
    // Cliquer sur le bouton Rechercher
    cy.get('button.btn-rechercher').contains('Rechercher').click()
    
    // Attendre les résultats
    cy.wait(1000)
    
    // Vérifier qu'au moins une annonce apparaît
    cy.get('.results-table table tbody tr').should('have.length.at.least', 1)
    
    // Trouver la ligne contenant Montpellier ET Nîmes et cliquer sur Réserver
    cy.get('.results-table table tbody tr').contains('Montpellier').parents('tr')
      .contains('Nîmes').parents('tr')
      .find('button.btn-reserver').contains('Réserver').click()
    
    // Attendre l'ouverture de la modale de confirmation
    cy.wait(1000)
    
    // Vérifier que la modale est visible
    cy.get('.modal-backdrop .modal').should('be.visible')
    
    // Confirmer la réservation en cliquant sur le bouton de confirmation
    cy.get('.modal-actions button.btn-danger').click()
    
    // Attendre la confirmation
    cy.wait(2000)
    
    // Naviguer vers mes réservations pour vérifier
    cy.visit('/reservations')
    
    // Vérifier que la réservation apparaît dans la liste
    cy.contains('Montpellier').should('exist')
    cy.contains('Nîmes').should('exist')
  })
})