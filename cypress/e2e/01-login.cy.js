describe('Covoit - Test de connexion', () => {
  it('devrait se connecter avec succès en tant qu\'administrateur', () => {
    // Visiter la page de connexion
    cy.visit('https://covoit.goegilles.fr/login')
    
    // Remplir le champ email
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    
    // Remplir le champ mot de passe
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    
    // Cliquer sur le bouton VALIDER
    cy.get('button.submit-btn').click()
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard')
    
    // Vérifier que l'utilisateur est bien connecté
    cy.contains('Mon tableau de bord', { matchCase: false }).should('exist')
    cy.contains('Cypress Test-user-1', { matchCase: false }).should('exist')

  })
})