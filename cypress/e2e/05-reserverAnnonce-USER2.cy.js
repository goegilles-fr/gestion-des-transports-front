describe('Covoit - Test réservation sur annonce existante', () => {
  it('devrait se connecter avec USER2 et réserver une place sur l\'annonce de USER1', () => {
    // Connexion avec USER2
    cy.visit('/login')
    
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL2'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD2'))
    cy.get('button.submit-btn').click()
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard')
    cy.wait(1000)
    
    // Naviguer vers la page de recherche de covoiturages
    cy.visit('/covoiturages')
    
    // Remplir les critères de recherche correspondant à l'annonce créée par USER1
    // Adresse de départ - Montpellier
    cy.get('input[placeholder="Ville"]').first().type('Montpellier')
    
    // Adresse d'arrivée - Nîmes  
    cy.get('input[placeholder="Ville"]').last().type('Nîmes')
    
    // Date de départ (demain - même date que l'annonce créée)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(dateString)
    
    // Heure de départ (même heure que l'annonce créée - 14:30)
    cy.get('input[type="time"]').type('14:30')
    
    // Cliquer sur le bouton Rechercher
    cy.contains('button', 'Rechercher').click()
    
    // Attendre les résultats
    cy.wait(1000)
    
    // Vérifier qu'au moins une annonce apparaît avec Montpellier et Nîmes
    cy.get('table.table tbody tr').should('have.length.at.least', 1)
    
    // Trouver la ligne contenant Montpellier ET Nîmes et cliquer sur Réserver
    cy.get('table.table tbody tr').contains('Montpellier').parents('tr')
      .contains('Nîmes').parents('tr')
      .find('button').contains('Réserver').click()
    
    // Attendre l'ouverture de la modale de confirmation
    cy.wait(500)
    
    // Vérifier que la modale contient les informations correctes
    cy.contains('Réserver une place').should('be.visible')
    cy.contains('Montpellier').should('be.visible')
    cy.contains('Nîmes').should('be.visible')
    
    // Confirmer la réservation
    cy.get('button.btn.btn-danger').contains('Reserver').click()
    
    // Attendre la confirmation
    cy.wait(2000)
    
    // Naviguer vers mes réservations pour vérifier
    cy.visit('/mes-reservations')
    
    // Vérifier que la réservation apparaît dans la liste
    cy.contains('Montpellier').should('exist')
    cy.contains('Nîmes').should('exist')
  })
})