'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('buddies', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      addresseeId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }).then(() => {
      return queryInterface.addIndex('buddies', ['requesterId'], { name: 'buddyRequesterId' });
    }).then(() => {
      return queryInterface.addIndex('buddies', ['addresseeId'], { name: 'buddyAddresseeId' });
    }).then(() => {
      return queryInterface.addIndex('buddies', ['status'], { name: 'buddyStatus' });
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('buddies');
  }
};
