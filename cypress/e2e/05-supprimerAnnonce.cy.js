describe('Covoit - Test suppression annonce', () => {
  it('devrait supprimer toutes les annonces créées', () => {
    // Visiter la page de connexion
    cy.visit('https://covoit.goegilles.fr/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    cy.get('button.submit-btn').click()
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard')
    cy.wait(1000)
    
    // Aller directement sur mes annonces
    cy.visit('https://covoit.goegilles.fr/mes-annonces')
    cy.wait(1000)
    
    // S'assurer qu'on est sur le filtre "À venir"
    cy.contains('button', '📅 À venir').click()
    cy.wait(500)
    
    // Fonction récursive pour supprimer toutes les annonces
    const deleteAllAnnonces = () => {
      cy.get('body').then($body => {
        // Vérifier s'il y a des boutons de suppression
        if ($body.find('.delete-btn').length > 0) {
          // Cliquer sur le premier bouton de suppression
          cy.get('.delete-btn').first().click()
          
          // Attendre que le modal s'ouvre
          cy.wait(500)
          
          // Cliquer sur CONFIRMER dans le modal
          cy.contains('button', 'Confirmer').click()
          
          // Attendre la suppression
          cy.wait(2000)
          
          // Rappeler la fonction pour supprimer la suivante
          deleteAllAnnonces()
        } else {
          cy.log('Toutes les annonces ont été supprimées')
        }
      })
    }
    
    // Lancer la suppression
    deleteAllAnnonces()
    
    // Vérifier le message "aucune annonce"
    cy.contains('Vous n\'avez pas d\'annonce à venir.').should('be.visible')
  })
})