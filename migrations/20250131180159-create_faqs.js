'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("faqs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      question_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      question_hi: {
        type: Sequelize.TEXT
      },
      question_bn: {
        type: Sequelize.TEXT
      },
      question_original: {
        type: Sequelize.TEXT
      },
      answer_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      answer_hi: {
        type: Sequelize.TEXT,
      },
      answer_bn: {
        type: Sequelize.TEXT,
      },
      answer_original: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      original_language: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Original language code (en, hi, bn)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("faqs");
  }
};