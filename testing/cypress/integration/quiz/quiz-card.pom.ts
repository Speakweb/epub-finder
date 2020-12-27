export const CurrentQuizCard = '#current-quiz-card';

export class QuizCardPom {
    constructor(private id: string) {
    }

    body() {
        return cy.get(this.id);
    }

    img() {
        this.body().find('img')
    }

    easy() {
        return this.body().find('.quiz-button-easy')
    }

    medium() {
        return this.body().find('.quiz-button-medium')
    }

    hard() {
        return this.body().find('.quiz-button-hard')
    }

    hide() {
        return this.body().find('.quiz-button-hide')
    }

    characters() {
        return this.body().find('.quiz-text')
    }

    exampleSentences() {
        return this.body()
            .find('iframe')
            .its('0.contentDocument').should('exist')
            .its('body').should('not.be.undefined')
            .then(cy.wrap)
            .find('.example-sentence')
    }

    editDescription(newDescription: string) {
        this.body()
            .find('.known-language')
            .find('.edit-icon')
            .click();
        // Now edit the text and unfocus
        this.body()
            .find('.known-language')
            .type(newDescription);
        // Now wait for editing to disappear
        this.body()
            .find('.known-language.editing')
            .should('not.exist');
    }

    selectNewImage() {
        // HACK, I just don't want to verify what src there is not, I'm just happy if it's not empty
        const oldSrc = '';
        this.body()
            .find('.image-container')
            .find('.edit-icon')
            .click();

        cy.get('.image-search-modal')
            .find('.image-search-result')
            .should('exist')

        cy.get('.image-search-modal')
            .find('.image-search-result')
            .click();

        // Now assert we have an image we clicked
        this.body()
            .find('.image')
            .should('have.attr', 'src').should('not.include', oldSrc);
    }
}