describe('Covoit - Test réservation sur annonce existante', () => {
  it('devrait se connecter avec USER2 et réserver une place sur l\'annonce de USER1', () => {
    // Connexion avec USER2
    cy.visit('/login')
    
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL2'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD2'))
    cy.get('button.submit-btn').click()
    
    cy.wait(1500)
    
    // Naviguer vers la page de recherche de covoiturages
    cy.visit('/reservations/rechercher')
    
    // Ville de départ
    cy.get('app-autocomplete-ville').first().find('input.autocomplete-input').type('test_Montpellier')
    
    // Ville d'arrivée
    cy.get('app-autocomplete-ville').last().find('input.autocomplete-input').type('test_Nîmes')
    
    // Date de départ
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(dateString)
    
    // Cliquer sur le bouton Rechercher
    cy.get('button.btn-rechercher').contains('Rechercher').click()
    
    // Wait for the results section to appear
    cy.get('.results-section', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    
    cy.get('button.btn-reserver', { timeout: 10000 }).should('exist').and('be.visible')
    
    cy.wait(1500)
    cy.get('button.btn-reserver').first().click()
    cy.wait(1500)
    // Wait for modal
    cy.get('.modal-backdrop .modal', { timeout: 5000 }).should('be.visible')
    
    // Confirm
    cy.get('.modal-actions button.btn-danger').click()
    
    cy.wait(2000)
    
    // Verify reservation
    cy.visit('/reservations')
     cy.wait(2000)
    cy.contains('test_Montpellier').should('exist')
    cy.contains('test_Nîmes').should('exist')
    cy.contains('TestMarque').should('exist')
  })
})