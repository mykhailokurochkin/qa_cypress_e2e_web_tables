/* eslint-disable */
/// <reference types='cypress' />
import { faker } from '@faker-js/faker';

describe('Web Tables page', () => {
  const baseUrl = 'https://demoqa.com/webtables';

  const generateWorker = () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 65 }).toString(),
    salary: faker.number.int({ min: 30000, max: 150000 }).toString(),
    department: faker.commerce.department()
  });

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('should have working pagination', () => {
    cy.get('.-next').should('be.visible');
    cy.get('.-previous').should('be.visible');

    cy.get('.pagination-bottom .-pageJump input').should('have.value', '1');
    cy.get('.-next').click();
    cy.get('.pagination-bottom .-pageJump input').should('have.value', '2');
    cy.get('.-previous').click();
    cy.get('.pagination-bottom .-pageJump input').should('have.value', '1');
  });

  it('should allow changing rows per page', () => {
    const options = [5, 10, 20, 25, 50, 100];

    options.forEach((option) => {
      cy.get('[aria-label="rows per page"]').click();
      cy.get(`.react-select__option:contains("${option} rows")`).click();
      cy
        .get('.rt-tbody .rt-tr:not(.-padRow)')
        .should('have.length.lte', option);
    });
  });

  it('should add a new worker', () => {
    const newWorker = generateWorker();

    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(newWorker.firstName);
    cy.get('#lastName').type(newWorker.lastName);
    cy.get('#userEmail').type(newWorker.email);
    cy.get('#age').type(newWorker.age);
    cy.get('#salary').type(newWorker.salary);
    cy.get('#department').type(newWorker.department);
    cy.get('#submit').click();
    cy.get('.rt-tbody')
      .should('contain', newWorker.firstName)
      .and('contain', newWorker.lastName)
      .and('contain', newWorker.email);
  });

  it('should delete a worker', () => {
    let firstName, lastName;

    const worker = generateWorker();
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(worker.firstName);
    cy.get('#lastName').type(worker.lastName);
    cy.get('#userEmail').type(worker.email);
    cy.get('#age').type(worker.age);
    cy.get('#salary').type(worker.salary);
    cy.get('#department').type(worker.department);
    cy.get('#submit').click();

    cy.get('#searchBox').clear().type(worker.firstName);
    cy.get('.rt-tbody .rt-tr-group')
      .first()
      .within(() => {
        cy.get('.rt-td').eq(0).invoke('text').then((text) => {
          firstName = text.trim();
        });
        cy.get('.action-buttons [title="Delete"]').click();
      });

    cy.get('.rt-tbody')
      .should('not.contain', firstName);
  });

  it('should delete all workers', () => {
    const deleteAllOnPage = () => {
      return cy.get('.rt-tbody .rt-tr:not(.-padRow)').then(($rows) => {
        if ($rows.length === 0) {
          return false;
        }

        return cy.get('.action-buttons [title="Delete"]').each(($btn) => {
          cy.wrap($btn).click();
        }).then(() => true);
      });
    };

    const deleteAllWorkers = () => {
      deleteAllOnPage().then((deletedAny) => {
        if (deletedAny) {
          cy.get('.-next:not(.-disabled)').then(($nextBtn) => {
            if ($nextBtn.length > 0) {
              cy.wrap($nextBtn).click();
              cy.get('.rt-tbody .rt-tr:not(.-padRow)').should('exist');
              deleteAllWorkers();
            }
          });
        }
      });
    };

    deleteAllWorkers();

    cy.get('.rt-noData').should('be.visible');
    cy.get('.rt-tbody .rt-tr:not(.-padRow)').should('not.exist');
  });

  it('should find and edit a worker', () => {
    const newWorker = generateWorker();

    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(newWorker.firstName);
    cy.get('#lastName').type(newWorker.lastName);
    cy.get('#userEmail').type(newWorker.email);
    cy.get('#age').type(newWorker.age);
    cy.get('#salary').type(newWorker.salary);
    cy.get('#department').type(newWorker.department);
    cy.get('#submit').click();

    cy.get('#searchBox').type(newWorker.firstName);
    cy.get('.action-buttons [title="Edit"]').first().click();
    const updatedEmail = faker.internet.email();
    cy.get('#userEmail').clear().type(updatedEmail);
    cy.get('#submit').click();
    cy.get('.rt-tbody').should('contain', newWorker.firstName);
    cy.get('.rt-tbody').should('contain', updatedEmail);
  });

  it('should validate data in the worker row after editing', () => {
    const newWorker = generateWorker();
    const updatedWorker = generateWorker();

    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(newWorker.firstName);
    cy.get('#lastName').type(newWorker.lastName);
    cy.get('#userEmail').type(newWorker.email);
    cy.get('#age').type(newWorker.age);
    cy.get('#salary').type(newWorker.salary);
    cy.get('#department').type(newWorker.department);
    cy.get('#submit').click();

    cy.get('#searchBox').type(newWorker.firstName);
    cy.get('.action-buttons [title="Edit"]').first().click();


    cy.get('#firstName').clear().type(updatedWorker.firstName);
    cy.get('#lastName').clear().type(updatedWorker.lastName);
    cy.get('#userEmail').clear().type(updatedWorker.email);
    cy.get('#age').clear().type(updatedWorker.age);
    cy.get('#salary').clear().type(updatedWorker.salary);
    cy.get('#department').clear().type(updatedWorker.department);
    cy.get('#submit').click();

    cy.get('.rt-tbody .rt-tr-group').first().within(() => {
      cy.get('.rt-td').eq(0).should('contain', updatedWorker.firstName);
      cy.get('.rt-td').eq(1).should('contain', updatedWorker.lastName);
      cy.get('.rt-td').eq(2).should('contain', updatedWorker.age);
      cy.get('.rt-td').eq(3).should('contain', updatedWorker.email);
      cy.get('.rt-td').eq(4).should('contain', updatedWorker.salary);
      cy.get('.rt-td').eq(5).should('contain', updatedWorker.department);
    });
  });

  it('should search by all column values', () => {
    cy.get('.rt-tbody .rt-tr-group').first().then(($row) => {
      const columnValues = [];
      const cells = $row.find('.rt-td');

      cells.each((index, cell) => {
        if (index < 6) {
          const value = cell.textContent.trim();
          if (value) {
            columnValues.push(value);
          }
        }
      });

      columnValues.forEach((value) => {
        if (value) {
          cy.get('#searchBox').clear().type(value);
          cy.get('.rt-tbody .rt-tr-group').first().should('contain', value);
        }
      });
    });
  });
});
