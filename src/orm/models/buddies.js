import Sequelize from 'sequelize';
import db from '../sequelize-db';
import Pilot from './pilots';


const Buddy = db.define('buddy', {
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
  }
}, {
  timestamps: true,

  indexes: [
    {
      name: 'buddyRequesterId',
      fields: ['requesterId']
    },
    {
      name: 'buddyAddresseeId',
      fields: ['addresseeId']
    },
    {
      name: 'buddyStatus',
      fields: ['status']
    }
  ]
});


Pilot.hasMany(Buddy, { as: 'RequestedBuddies', foreignKey: 'requesterId', constraints: false });
Pilot.hasMany(Buddy, { as: 'AddedBuddies', foreignKey: 'addresseeId', constraints: false });

Buddy.belongsTo(Pilot, { as: 'Requester', foreignKey: 'requesterId', constraints: false });
Buddy.belongsTo(Pilot, { as: 'Addressee', foreignKey: 'addresseeId', constraints: false });


export default Buddy;
