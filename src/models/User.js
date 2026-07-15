const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: null },
    gender: { type: String, enum: ['male', 'female'], default: 'male', index: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    loyaltyPoints: { type: Number, default: 0 },
    tier: { type: String, default: 'Member' },
    twoFactorEnabled: { type: Boolean, default: false },
    deviceTokens: { type: [String], default: [] },
    favorites: { type: [mongoose.Schema.Types.ObjectId], ref: 'Salon', default: [] },
    settings: {
      locationAccess: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
      remindersEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};
userSchema.method('toJSON', function () {
  const { _id, passwordHash, deviceTokens, __v, ...rest } = this.toObject();
  return { id: _id.toString(), ...rest };
});

module.exports = mongoose.model('User', userSchema);
