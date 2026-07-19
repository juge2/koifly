'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('sites', 'launchType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'foot'
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('sites', 'launchType');
  }
};
