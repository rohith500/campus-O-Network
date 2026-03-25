describe('Sign up flow', () => {
  it('opens register page from homepage, fills form, and submits', () => {
    cy.visit('http://localhost:4200');

    cy.contains('a', 'Register').click();
    cy.url().should('include', '/auth/register');

    const uniqueEmail = `e2e.${Date.now()}@campus.test`;

    cy.get('input[formcontrolname="fullName"]').type('Cypress Tester');
    cy.get('input[formcontrolname="email"]').type(uniqueEmail);

    cy.get('mat-select[formcontrolname="department"]').click();
    cy.contains('mat-option', 'Computer Science').click();

    cy.get('input[formcontrolname="password"]')
      .scrollIntoView()
      .clear({ force: true })
      .type('password123', { force: true });
    cy.get('input[formcontrolname="confirmPassword"]')
      .scrollIntoView()
      .clear({ force: true })
      .type('password123', { force: true });

    cy.contains('button', 'Create Account').click();
  });
});
