import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = require('../secrets').bcryptRounds;


const BcryptPromise = {
  hash(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  compare(newPassword, hash) {
    return bcrypt.compare(newPassword, hash).then(isMatch => {
      if (isMatch) return;
      throw new Error('password mismatch');
    });
  }
};


export default BcryptPromise;
