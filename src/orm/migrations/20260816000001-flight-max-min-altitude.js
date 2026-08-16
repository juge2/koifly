'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist first
    const tableInfo = await queryInterface.describeTable('flights');
    
    if (!tableInfo.maxAltitude) {
      await queryInterface.addColumn('flights', 'maxAltitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null,
        comment: 'Maximum altitude from IGC track (meters), or user-entered when no IGC'
      });
    }
    
    if (!tableInfo.minAltitude) {
      await queryInterface.addColumn('flights', 'minAltitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null,
        comment: 'Minimum altitude from IGC track (meters)'
      });
    }

    // Backfill maxAltitude from existing altitude column for all flights
    await queryInterface.sequelize.query(`
      UPDATE \`flights\` SET \`maxAltitude\` = \`altitude\` WHERE \`maxAltitude\` IS NULL
    `);
  },

  down: async queryInterface => {
    const tableInfo = await queryInterface.describeTable('flights');
    if (tableInfo.maxAltitude) {
      await queryInterface.removeColumn('flights', 'maxAltitude');
    }
    if (tableInfo.minAltitude) {
      await queryInterface.removeColumn('flights', 'minAltitude');
    }
  }
};
