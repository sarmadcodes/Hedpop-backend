// Creates (or resets) the demo account that App Store reviewers sign in with.
//
// Run on the server, from the backend folder:
//   REVIEW_PASSWORD='choose-a-password' npm run seed:review
//
// Optional:  REVIEW_EMAIL=someone@example.com   (default: review@hedpop.threadique.live)
//
// The password is read from the environment only and is never printed or stored
// in the repo. Safe to re-run: it resets the password and tops up a sample
// booking, and refuses to touch any account that isn't the review account.
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Booking = require('../models/Booking');

const REVIEW_NAME = 'App Review';
const EMAIL = (process.env.REVIEW_EMAIL || 'review@hedpop.threadique.live').trim().toLowerCase();
const PASSWORD = process.env.REVIEW_PASSWORD;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const TIMES = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];

// Same label the app's booking flow sends: "Mon, 12 October 2026".
const dateLabel = (d) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const makeRef = () =>
  'HP-' + Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

(async () => {
  if (!PASSWORD || PASSWORD.length < 8) {
    fail("Set a password of at least 8 characters, e.g.\n  REVIEW_PASSWORD='your-password-here' npm run seed:review");
  }
  if (!/^\S+@\S+\.\S+$/.test(EMAIL)) fail(`"${EMAIL}" is not a valid email address.`);

  try {
    await connectDB();

    const passwordHash = await User.hashPassword(PASSWORD);
    let user = await User.findOne({ email: EMAIL });

    if (user) {
      // Never overwrite a real customer's password by accident.
      if (user.role !== 'customer' || user.name !== REVIEW_NAME) {
        fail(`${EMAIL} already belongs to a different account. Use another REVIEW_EMAIL.`);
      }
      user.passwordHash = passwordHash;
      await user.save();
      console.log(`Reset the password of the existing review account (${EMAIL}).`);
    } else {
      user = await User.create({
        name: REVIEW_NAME,
        email: EMAIL,
        passwordHash,
        role: 'customer',
        gender: 'male',
      });
      console.log(`Created the review account (${EMAIL}).`);
    }

    // A sample booking so reviewers see a populated "My Bookings" screen.
    const hasBooking = await Booking.exists({ user: user._id, status: { $ne: 'Cancelled' } });
    if (hasBooking) {
      console.log('The account already has a booking — leaving bookings as they are.');
    } else {
      const salon = await Salon.findOne({ 'services.0': { $exists: true } });
      if (!salon) {
        console.log('No salon with services found — run `npm run seed` first to add a sample booking.');
      } else {
        const service = salon.services[0];
        const when = new Date();
        when.setDate(when.getDate() + 3);
        const date = dateLabel(when);

        let time = null;
        for (const candidate of TIMES) {
          const taken = await Booking.exists({ salon: salon._id, date, time: candidate, status: { $ne: 'Cancelled' } });
          if (!taken) {
            time = candidate;
            break;
          }
        }
        if (!time) {
          console.log('No free slot found for the sample booking — skipped.');
        } else {
          await Booking.create({
            user: user._id,
            salon: salon._id,
            salonTitle: salon.title,
            serviceId: String(service._id),
            serviceName: service.name,
            duration: service.duration,
            price: service.price,
            date,
            time,
            status: 'Confirmed',
            reference: makeRef(),
          });
          console.log(`Added a sample booking: ${salon.title}, ${service.name}, ${date} at ${time}.`);
        }
      }
    }

    console.log('\n✅ Done. Sign-in email:', EMAIL);
    console.log('   Password: the REVIEW_PASSWORD you just supplied (not shown).\n');
  } catch (err) {
    console.error('Review account setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
