describe('Covoit - Test Nettoyage USER 2', () => {
  it('devrait vérifier qu\'il n\'y a ni annonces ni véhicule personnel', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL2'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD2'))
    cy.get('button.submit-btn').click()
    cy.wait(500)
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/accueil')
    
    // Vérifier qu'il n'y a pas d'annonces
    cy.visit('/covoits')
    cy.wait(1000)
    cy.contains('Vous n\'avez pas d\'annonce à venir.').should('be.visible')
    
    // Vérifier qu'il n'y a pas de véhicule personnel
    cy.visit('/vehicules')
    cy.wait(1000)
    cy.contains('pas encore de véhicule personnel.').should('be.visible')

     // Vérifier qu'il n'y a pas de réservations
    cy.visit('/reservations')
    cy.wait(1000)
    cy.contains('pas encore réservé de covoiturage.').should('be.visible')

    
    cy.log('✅ Vérification terminée: aucune annonce et aucun véhicule personnel')
  })
})