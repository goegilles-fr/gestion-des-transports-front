describe('Covoit - Test suppression annonce', () => {
  it('devrait supprimer toutes les annonces créées', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    cy.get('button.submit-btn').click()
    
  
    cy.wait(500)
    
    // Aller directement sur mes annonces
    cy.visit('/covoits')
    cy.wait(1000)
    
    // S'assurer qu'on est sur le filtre "À venir"
    cy.contains('button', '📅 À venir').click()
    cy.wait(1500)
    
   
          // Cliquer sur le premier bouton de suppression
          cy.get('.delete-btn').first().click()
          
          // Attendre que le modal s'ouvre
          cy.wait(1500)
          
          // Cliquer sur CONFIRMER dans le modal
          cy.contains('button', 'Confirmer').click()
          
          // Attendre la suppression
          cy.wait(2000)
          
          // Rappeler la fonction pour supprimer la suivante
         
       

    cy.visit('/covoits')
    cy.wait(1000)
    // Vérifier le message "aucune annonce"
    cy.contains('Vous n\'avez pas d\'annonce à venir.').should('be.visible')
  })
})