import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = require('../secrets').bcryptRounds;


const BcryptPromise = {
  hash(password) {
    if (process.env.NODE_ENV === 'development') {
      const start = Date.now();
      return bcrypt.hash(password, BCRYPT_ROUNDS).then(h => {
        console.log('[BCRYPT] hash took', Date.now() - start, 'ms');
        return h;
      });
    }
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  compare(newPassword, hash) {
    if (process.env.NODE_ENV === 'development') {
      const start = Date.now();
      return bcrypt.compare(newPassword, hash).then(isMatch => {
        console.log('[BCRYPT] compare took', Date.now() - start, 'ms, match:', isMatch);
        if (!isMatch) throw new Error('password mismatch');
        return;
      });
    }
    return bcrypt.compare(newPassword, hash).then(isMatch => {
      if (!isMatch) throw new Error('password mismatch');
      return;
    });
  }
};


export default BcryptPromise;
