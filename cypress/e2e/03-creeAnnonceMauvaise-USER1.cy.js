describe('Covoit - Test validation formulaire annonce', () => {
  it('devrait afficher les messages d\'erreur de validation', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    cy.get('button.submit-btn').click()
    
    
    
    // Cliquer sur Annonces
    cy.contains('Annonces').click()
    cy.wait(500)
    
    // Cliquer sur POSTER UNE ANNONCE
    cy.contains('POSTER UNE ANNONCE').click()
    cy.url().should('include', '/covoits/creer')
    
    // TEST 1: Date dans le passé
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toISOString().split('T')[0]
    
    cy.get('input#dateDepart').type(yesterdayString)
    cy.get('input#dateDepart').blur() // Déclencher la validation
    
    // Vérifier le message d'erreur
    cy.contains('La date ne peut pas être dans le passé').should('be.visible')
    
    // Corriger la date pour continuer
    cy.get('input#dateDepart').clear()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = tomorrow.toISOString().split('T')[0]
    cy.get('input#dateDepart').type(tomorrowString)
    
    // TEST 2: Durée du trajet à 0
    cy.get('input#dureeTrajet').type('0')
    cy.get('input#dureeTrajet').blur()
    
    // Vérifier le message d'erreur
    cy.contains('La durée doit être d\'au moins 1 minute').should('be.visible')
    
    // TEST 3: Distance négative
    cy.get('input#distance').type('-20')
    cy.get('input#distance').blur()
    
    // Vérifier le message d'erreur
    cy.contains('La distance doit être d\'au moins 1 km').should('be.visible')
  })
})