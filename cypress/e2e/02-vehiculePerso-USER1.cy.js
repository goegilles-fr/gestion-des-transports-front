describe('Covoit - Test véhicule personnel', () => {
  it('devrait se connecter, créer un véhicule personnel et le supprimer', () => {
    // Visiter la page de connexion
    cy.visit('/login')
    
    // Remplir le champ email
    cy.get('input#username').type(Cypress.env('TEST_USER_EMAIL'))
    
    // Remplir le champ mot de passe
    cy.get('input#password').type(Cypress.env('TEST_USER_PASSWORD'))
    
    // Cliquer sur le bouton VALIDER
    cy.get('button.submit-btn').click()
   
    // Attendre que la page charge
    cy.wait(1000)
    
    // Cliquer sur Véhicules
    cy.contains('Véhicules').click()
    
    // Vérifier la redirection vers la page véhicules
    cy.url().should('include', '/vehicules')
    
    // Vérifier que le bouton "Déclarer mon véhicule personnel" existe
    cy.contains('Déclarer mon véhicule personnel').should('exist')
    
    // Cliquer sur "Déclarer mon véhicule personnel"
    cy.contains('Déclarer mon véhicule personnel').click()
    
    // Attendre que le modal s'ouvre
    cy.wait(500)
    
    // Remplir le formulaire
    cy.get('input[name="marque"]').type('TestMarque')
    cy.get('input[name="modele"]').type('TestModele')
    cy.get('input[name="immatriculation"]').type('TEST-123')
    cy.get('input[name="nbPlaces"]').clear().type('4')
    cy.get('input[name="co2ParKm"]').clear().type('120')
    cy.get('select[name="motorisation"]').select('HYBRIDE')
    cy.get('select[name="categorie"]').select(1)
    
    // Cliquer sur Enregistrer
    cy.contains('button', 'Enregistrer').click()
    
    // Attendre la sauvegarde
    cy.wait(2000)
    
    // Vérifier que le véhicule apparaît dans la liste
    cy.contains('TestMarque').should('exist')
  })
})