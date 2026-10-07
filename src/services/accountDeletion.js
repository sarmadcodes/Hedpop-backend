const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitBookingCancelled } = require('./socket');

// Permanently removes a user and the personal data attached to them
// (profile, favourites and device tokens live on the user document itself).
//
// NOTE: salons embed reviews that reference their author (Salon.reviews[].user).
// Reviews can't be written from the app yet; when that ships, remove or
// anonymise them here as well.
//
// Order matters: dependent data goes first and the user document last, so a
// failure part-way through leaves the account in place and the request can
// simply be retried. Nothing is left pointing at a user that no longer exists.
async function deleteUserAndData(userId) {
  // Confirmed bookings hold a time slot — remember them so the slot can be
  // released for anyone currently looking at that salon/date.
  const heldSlots = await Booking.find({ user: userId, status: 'Confirmed' })
    .select('salon date time reference')
    .lean();

  await Booking.deleteMany({ user: userId });
  await Notification.deleteMany({ user: userId });
  await User.deleteOne({ _id: userId });

  // Best-effort and last: the data is already gone, a socket hiccup must not
  // turn a successful deletion into an error response.
  for (const slot of heldSlots) {
    try {
      emitBookingCancelled(slot);
    } catch (err) {
      console.warn('[accountDeletion] could not broadcast freed slot:', err.message);
    }
  }
}

module.exports = { deleteUserAndData };
