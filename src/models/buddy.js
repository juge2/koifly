import BaseModel from './base-model';
import dataService from '../services/data-service';


let BuddyModel = {
  keys: {
    single: 'buddy',
    plural: 'buddies'
  },

  /**
   * @returns {array|null|object} - array of buddy relationships
   * null - if no data in front end
   * error object - if data wasn't loaded due to error
   */
  getListOutput() {
    const storeContent = this.getStoreContent();
    if (!storeContent || storeContent.error) {
      return storeContent;
    }

    const buddies = Object.values(storeContent);
    return {
      accepted: buddies.filter(b => b.status === 'accepted'),
      incoming: buddies.filter(b => b.status === 'pending' && b.isIncoming),
      outgoing: buddies.filter(b => b.status === 'pending' && !b.isIncoming),
      rejected: buddies.filter(b => b.status === 'rejected')
    };
  },

  inviteBuddy(email) {
    return dataService.inviteBuddy(email);
  },

  respondToInvite(buddyId, status) {
    return dataService.respondToBuddy(buddyId, status);
  },

  removeBuddy(buddyId) {
    return dataService.removeBuddy(buddyId);
  }
};


BuddyModel = Object.assign({}, BaseModel, BuddyModel);
export default BuddyModel;
