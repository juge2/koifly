/* eslint-disable new-cap */
import Sequelize from 'sequelize';
import db from '../sequelize-db';
import errorMessages from '../../errors/error-messages';
import isUnique from '../validation-helpers/is-unique';
import ormConstants from '../../constants/orm-constants';

import Pilot from './pilots';


const Glider = db.define(
  'glider',

  // attributes
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      unique: true,
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING(100), // eslint-disable-line new-cap
      allowNull: false,
      validate: {
        len: {
          args: [0, 100],
          msg: errorMessages.MAX_LENGTH.replace('%field', 'Glider Name').replace('%max', '100')
        }
      }
    },

    initialFlightNum: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: errorMessages.POSITIVE_ROUND.replace('%field', 'Initial Flight Number') },
        min: {
          args: [ 0 ],
          msg: errorMessages.POSITIVE_ROUND.replace('%field', 'Initial Flight Number')
        }
      }
    },

    initialAirtime: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: errorMessages.POSITIVE_ROUND.replace('%field', 'Initial Airtime') },
        min: {
          args: [ 0 ],
          msg: errorMessages.POSITIVE_ROUND.replace('%field', 'Initial Airtime')
        }
      }
    },

    remarks: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
      validate: {
        len: {
          args: [0, 10000],
          msg: errorMessages.MAX_LENGTH.replace('%field', 'Remarks').replace('%max', '10000')
        }
      }
    },

    see: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: { isIn: [ [0, 1, true, false] ] }
    },

    pilotId: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },

  // options
  {
    timestamps: true, // automatically adds fields updatedAt and createdAt

    scopes: {
      [ormConstants.SCOPES.visible]: {
        where: {
          see: true
        }
      }
    },

    hooks: {
      beforeValidate: function(instance, options) {
        const errorMsg = errorMessages.DOUBLE_VALUE.replace('%field', 'Glider');
        return isUnique(Glider, instance, 'name', errorMsg, options.transaction);
      }
    },

    indexes: [
      {
        name: 'gliderPilotId',
        fields: [ 'pilotId' ]
      },
      {
        name: 'gliderUpdatedAt',
        fields: [ 'updatedAt' ]
      }
    ]
  }
);


Pilot.hasMany(Glider, {
  as: 'Gliders', // pilotInstance.getGliders, pilotInstance.setGliders
  foreignKey: 'pilotId',
  constraints: false
});


export default Glider;
