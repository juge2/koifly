import Buddy from '../../orm/models/buddies';
import KoiflyError from '../../errors/error';
import normalizeError from '../../errors/normalize-error';
import errorTypes from '../../errors/error-types';
import Pilot from '../../orm/models/pilots';
import Sequelize from 'sequelize';


function buddyHandler(request) {
  const pilotId = request.auth.credentials.userId;
  const action = request.params.action;

  switch (action) {
    case 'list':
      return listBuddies(pilotId);
    case 'invite':
      return inviteBuddy(pilotId, request.payload.email);
    case 'respond':
      return respondToInvite(pilotId, request.payload.buddyId, request.payload.status);
    case 'remove':
      return removeBuddy(pilotId, request.payload.buddyId);
    default:
      throw new KoiflyError(errorTypes.BAD_REQUEST);
  }
}


function listBuddies(pilotId) {
  return Buddy
    .findAll({
      where: {
        [Sequelize.Op.or]: [
          { requesterId: pilotId },
          { addresseeId: pilotId }
        ]
      },
      include: [
        { model: Pilot, as: 'Requester', attributes: ['id', 'userName', 'email'] },
        { model: Pilot, as: 'Addressee', attributes: ['id', 'userName', 'email'] }
      ]
    })
    .then(buddies => {
      return buddies.map(b => {
        const otherPilot = b.requesterId === pilotId
          ? b.Addressee
          : b.Requester;
        return {
          id: b.id,
          see: true,
          requesterId: b.requesterId,
          addresseeId: b.addresseeId,
          status: b.status,
          otherPilot: {
            id: otherPilot.id,
            userName: otherPilot.userName,
            email: otherPilot.email
          },
          isIncoming: b.addresseeId === pilotId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt
        };
      });
    });
}


function inviteBuddy(pilotId, email) {
  if (!email) {
    return Promise.reject(new KoiflyError(errorTypes.VALIDATION_ERROR, 'Email is required'));
  }

  return Pilot
    .findOne({ where: { email: email.toLowerCase().trim() } })
    .then(targetPilot => {
      if (!targetPilot) {
        throw new KoiflyError(errorTypes.VALIDATION_ERROR, 'No pilot found with this email');
      }

      if (targetPilot.id === pilotId) {
        throw new KoiflyError(errorTypes.VALIDATION_ERROR, 'You cannot add yourself as a buddy');
      }

      return Buddy
        .findOne({
          where: {
            [Sequelize.Op.or]: [
              { requesterId: pilotId, addresseeId: targetPilot.id },
              { requesterId: targetPilot.id, addresseeId: pilotId }
            ]
          }
        })
        .then(existing => {
          if (existing) {
            if (existing.status === 'accepted') {
              throw new KoiflyError(errorTypes.VALIDATION_ERROR, 'This pilot is already your buddy');
            }
            if (existing.status === 'pending') {
              // If the previous invite was from us, it's still pending
              if (existing.requesterId === pilotId) {
                throw new KoiflyError(errorTypes.VALIDATION_ERROR, 'Invite already sent');
              }
              // If the previous invite was from them, auto-accept
              existing.status = 'accepted';
              return existing.save();
            }
            if (existing.status === 'rejected') {
              // Re-send invite
              existing.status = 'pending';
              existing.requesterId = pilotId;
              existing.addresseeId = targetPilot.id;
              return existing.save();
            }
          }

          return Buddy.create({
            requesterId: pilotId,
            addresseeId: targetPilot.id,
            status: 'pending'
          });
        });
    })
    .then(() => {
      return listBuddies(pilotId);
    })
    .catch(error => {
      throw normalizeError(error, errorTypes.DB_WRITE_ERROR);
    });
}


function respondToInvite(pilotId, buddyId, status) {
  if (!buddyId || !status) {
    return Promise.reject(new KoiflyError(errorTypes.BAD_REQUEST));
  }

  if (!['accepted', 'rejected'].includes(status)) {
    return Promise.reject(new KoiflyError(errorTypes.VALIDATION_ERROR, 'Status must be accepted or rejected'));
  }

  return Buddy
    .findOne({ where: { id: buddyId, addresseeId: pilotId, status: 'pending' } })
    .then(buddy => {
      if (!buddy) {
        throw new KoiflyError(errorTypes.RECORD_NOT_FOUND);
      }

      return buddy.update({ status: status });
    })
    .then(() => {
      return listBuddies(pilotId);
    })
    .catch(error => {
      throw normalizeError(error, errorTypes.DB_WRITE_ERROR);
    });
}


function removeBuddy(pilotId, buddyId) {
  if (!buddyId) {
    return Promise.reject(new KoiflyError(errorTypes.BAD_REQUEST));
  }

  return Buddy
    .findOne({
      where: {
        id: buddyId,
        [Sequelize.Op.or]: [
          { requesterId: pilotId },
          { addresseeId: pilotId }
        ]
      }
    })
    .then(buddy => {
      if (!buddy) {
        throw new KoiflyError(errorTypes.RECORD_NOT_FOUND);
      }

      return buddy.destroy();
    })
    .then(() => {
      return listBuddies(pilotId);
    })
    .catch(error => {
      throw normalizeError(error, errorTypes.DB_WRITE_ERROR);
    });
}


export default buddyHandler;
