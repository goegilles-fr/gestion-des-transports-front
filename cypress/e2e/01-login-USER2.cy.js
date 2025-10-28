describe('Covoit - Test de connexion', () => {
  it('devrait se connecter avec succès en tant qu\'administrateur', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Remplir le champ email
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL2'))
    
    // Remplir le champ mot de passe
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD2'))
    
    // Cliquer sur le bouton VALIDER
    cy.get('button.submit-btn').click()
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard')
    
    // Vérifier que l'utilisateur est bien connecté
    cy.contains('Mon tableau de bord', { matchCase: false }).should('exist')
    cy.contains('Cypress Test-user-2', { matchCase: false }).should('exist')

    // Vérifier qu'il n'y a pas d'annonces
    cy.visit('/mes-annonces')
    cy.wait(1000)
    cy.contains('Vous n\'avez pas d\'annonce à venir.').should('be.visible')
    
    // Vérifier qu'il n'y a pas de véhicule personnel
    cy.visit('/vehicules')
    cy.wait(1000)
    cy.contains('pas encore de véhicule personnel.').should('be.visible')

     // Vérifier qu'il n'y a pas de réservations
    cy.visit('/mes-reservations')
    cy.wait(1000)
    cy.contains('pas encore réservé de covoiturage.').should('be.visible')

  })
})