// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

declare namespace Cypress {
    interface Chainable {
        signupLogin(): Chainable<void>

        skipIntro(): Chainable<void>
        Å
    }
}
Cypress.Commands.add('signupLogin', () => {
    cy.task('randomEmailPassword')
        .then(({email, password}) => {
                cy.wait(1000)
                    .get('#signup-email').type(email)
                    .get('#signup-password').type(password)
                    .get('#signup-button').click()
            }
        )
})


Cypress.Commands.add('IframeBody', {
    prevSubject: true
}, (subject) => {
    return cy.wrap(subject)
        .its('0.contentDocument').should('exist')
        .its('body').should('not.be.undefined')
        .then(cy.wrap)
});

Cypress.Commands.add('skipIntro', () => {
    /*
        cy.get('.introjs-skipbutton')
            .then(el => {
                if (el) {
                    el.click()
                }
            })
    */
})
