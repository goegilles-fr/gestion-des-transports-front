describe('Covoit - Test création annonce', () => {
  it('devrait se connecter et créer une annonce de covoiturage', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Connexion
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    cy.get('button.submit-btn').click()
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard')
    cy.wait(1000)
    
    // Cliquer sur Annonces
    cy.contains('Annonces').click()
    
    // Attendre la redirection
    cy.wait(500)
    
    // Cliquer sur POSTER UNE ANNONCE
    cy.contains('POSTER UNE ANNONCE').click()
    
    // Vérifier qu'on est sur la page de création
    cy.url().should('include', '/annonces/create')
    
    // Remplir le formulaire - Section Date et Heure
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    cy.get('input#dateDepart').type(dateString)
    cy.get('input#heureDepart').type('14:30')
    cy.get('input#dureeTrajet').type('45')
    cy.get('input#distance').type('50')
    
    // Adresse de départ
    cy.get('input#numeroDepart').type('10')
    cy.get('input#libelleDepart').type('Rue de Test Départ')
    cy.get('input#codePostalDepart').type('34000')
    cy.get('input#villeDepart').type('Montpellier')
    
    // Adresse d'arrivée
    cy.get('input#numeroArrivee').type('25')
    cy.get('input#libelleArrivee').type('Avenue de Test Arrivée')
    cy.get('input#codePostalArrivee').type('34090')
    cy.get('input#villeArrivee').type('Nîmes')
    
    // Sélectionner le véhicule personnel (si disponible)
    cy.get('.vehicule-checkbox-inline').first().check()
    
    // Soumettre le formulaire
    cy.contains('button', 'CRÉER L\'ANNONCE').click()
    
    // Attendre la création et la redirection automatique
    cy.wait(3000)
    
    // Vérifier qu'on n'est plus sur la page de création
    cy.url().should('not.include', '/annonces/create')
    
    // Naviguer vers mes annonces via l'URL directement pour éviter les conflits
    cy.visit('/mes-annonces')
    
    // Vérifier que l'annonce apparaît dans la liste
    cy.contains('Montpellier').should('exist')
    cy.contains('Nîmes').should('exist')
    cy.contains('TestModele').should('exist')
  })
})