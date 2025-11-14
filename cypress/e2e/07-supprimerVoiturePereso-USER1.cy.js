describe('Covoit - Test suppression véhicule personnel', () => {
  it('devrait supprimer le véhicule personnel', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    cy.get('button.submit-btn').click()
    
   
    cy.wait(500)
    
    // Cliquer sur Véhicules
    cy.contains('Véhicules').click()
    
    // Vérifier la redirection vers la page véhicules
    cy.url().should('include', '/vehicules')
    cy.wait(1000)
    
    // Cliquer sur le bouton supprimer (🗑️)
    cy.get('button.icon-btn').contains('🗑️').click()
    
    // Attendre que le modal s'ouvre
    cy.wait(1500)
    
    // Cliquer sur Supprimer dans le modal
    cy.contains('button', 'Supprimer').click()
    
    // Attendre la suppression et recharger la page
    cy.wait(1300)
    cy.reload()
    cy.wait(1300)
    
    // Vérifier que le bouton "Déclarer mon véhicule personnel" réapparaît
    cy.contains('Déclarer mon véhicule personnel').should('exist')
    
    // Vérifier le message "aucun véhicule"
    cy.contains('pas encore de véhicule personnel.').should('be.visible')
  })
})