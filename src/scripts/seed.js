require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');

// ---------------------------------------------------------------------------
// Salons — variety of categories, locations, statuses, photos.
// ---------------------------------------------------------------------------

const baseServices = [
  { name: 'Classic Haircut', price: 25, duration: '30 Mins', desc: 'Traditional cut with hot towel finish', gender: 'men' },
  { name: 'Skin Fade', price: 45, duration: '40 Mins', desc: 'Modern fade with precision detailing', gender: 'men' },
  { name: 'Beard Trim', price: 20, duration: '30 Mins', desc: 'Beard sculpting and shaping', gender: 'men' },
  { name: 'Hot Towel Shave', price: 25, duration: '30 Mins', desc: 'Traditional straight-razor shave', gender: 'men' },
  { name: 'Wash & Style', price: 35, duration: '40 Mins', desc: 'Full wash, blow-dry and finish', gender: 'unisex' },
];

const salonServiceMatrix = {
  Salon: [
    ...baseServices,
    { name: 'Colour & Highlights', price: 80, duration: '90 Mins', desc: 'Full-head colour with bespoke highlights', gender: 'women' },
    { name: "Women's Cut & Style", price: 55, duration: '60 Mins', desc: 'Bespoke cut tailored to face shape', gender: 'women' },
  ],
  Barber: baseServices,
};

const baseReviews = [
  { name: 'James M.', stars: 5, text: 'Best haircut I have ever had. Friendly staff and a meticulous attention to detail.' },
  { name: 'Sara L.', stars: 5, text: 'Booked online and was seen on time. Very professional, would highly recommend.' },
  { name: 'Daniel K.', stars: 4, text: 'Good cut, lovely atmosphere. Parking can be tricky but worth the visit.' },
];

const SALONS = [
  {
    title: 'The Gentlemen Cuts', category: 'Barber', isOpen: true,
    location: 'Manchester', distance: '0.6 km away', time: '9:00 AM - 8:00 PM',
    rating: 4.9, reviewsCount: 312,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
  },
  {
    title: 'The London Barber Co.', category: 'Barber', isOpen: true,
    location: 'London', distance: '1.2 km away', time: '8:30 AM - 9:00 PM',
    rating: 4.8, reviewsCount: 254,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
  },
  {
    title: 'The Bearded Gent', category: 'Barber', isOpen: true,
    location: 'Manchester', distance: '2.1 km away', time: '9:00 AM - 11:00 PM',
    rating: 4.7, reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800',
  },
  {
    title: 'Union Jack Barbers', category: 'Barber', isOpen: false,
    location: 'Liverpool', distance: '3.4 km away', time: '10:00 AM - 7:00 PM',
    rating: 4.6, reviewsCount: 144,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
  },
  {
    title: 'The Royal Trim', category: 'Salon', isOpen: true,
    location: 'Birmingham', distance: '4.8 km away', time: '11:00 AM - 10:00 PM',
    rating: 4.9, reviewsCount: 489,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
  },
  {
    title: 'Glow Hair Studio', category: 'Salon', isOpen: true,
    location: 'Manchester', distance: '1.8 km away', time: '9:30 AM - 8:30 PM',
    rating: 4.8, reviewsCount: 367,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
  },
  {
    title: 'Pearl & Vine', category: 'Salon', isOpen: true,
    location: 'London', distance: '2.6 km away', time: '10:00 AM - 9:00 PM',
    rating: 4.7, reviewsCount: 221,
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
  },
  {
    title: 'The Barber Lounge Co.', category: 'Barber', isOpen: false,
    location: 'Poole', distance: '5.3 km away', time: '9:00 AM - 7:00 PM',
    rating: 4.5, reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
  },
];

// ---------------------------------------------------------------------------
// Build helper to produce a label format identical to what the mobile app uses.
// "Wed, 15 July 2026" — exactly what BookingFlowscreen produces.
// ---------------------------------------------------------------------------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function dateLabel(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const makeRef = () =>
  'HP-' + Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// ---------------------------------------------------------------------------

(async () => {
  try {
    await connectDB();

    // ----- Salons (with services + reviews) ----------------------------------
    await Salon.deleteMany({});
    const salonsToInsert = SALONS.map((s) => ({
      ...s,
      services: salonServiceMatrix[s.category] || baseServices,
      reviews: baseReviews.map((r) => ({ ...r })),
    }));
    const salons = await Salon.insertMany(salonsToInsert);
    console.log(`Salons seeded: ${salons.length}`);

    // ----- Users -------------------------------------------------------------
    await User.findOneAndUpdate(
      { email: 'admin@hedpop.test' },
      {
        name: 'Admin',
        email: 'admin@hedpop.test',
        passwordHash: await User.hashPassword('admin1234'),
        role: 'admin',
      },
      { upsert: true, new: true },
    );
    console.log('Admin user: admin@hedpop.test / admin1234');

    const demo = await User.findOneAndUpdate(
      { email: 'demo@hedpop.test' },
      {
        name: 'Charles',
        email: 'demo@hedpop.test',
        passwordHash: await User.hashPassword('demo1234'),
        role: 'customer',
        phone: '+44 0987 654321',
        address: '12 Kingsway, Manchester, UK',
        loyaltyPoints: 7890,
        tier: 'Premium Member',
        favorites: [salons[0]._id, salons[5]._id], // pre-favorite two salons
      },
      { upsert: true, new: true },
    );
    console.log('Demo customer: demo@hedpop.test / demo1234');

    // ----- Bookings (demo user history) --------------------------------------
    await Booking.deleteMany({ user: demo._id });

    const svc = (s, i) => s.services[i];
    const sampleBookings = [
      // Upcoming
      {
        salon: salons[0], svc: svc(salons[0], 1), date: dateLabel(2), time: '14:00',
        status: 'Confirmed',
      },
      {
        salon: salons[5], svc: svc(salons[5], 4), date: dateLabel(5), time: '11:30',
        status: 'Confirmed',
      },
      {
        salon: salons[1], svc: svc(salons[1], 0), date: dateLabel(8), time: '16:00',
        status: 'Confirmed',
      },
      // Past
      {
        salon: salons[2], svc: svc(salons[2], 2), date: dateLabel(-7), time: '10:30',
        status: 'Completed',
      },
      {
        salon: salons[0], svc: svc(salons[0], 0), date: dateLabel(-14), time: '13:00',
        status: 'Completed',
      },
      {
        salon: salons[7], svc: svc(salons[7], 3), date: dateLabel(-21), time: '15:30',
        status: 'Cancelled',
      },
    ];

    await Booking.insertMany(
      sampleBookings.map((b) => ({
        user: demo._id,
        salon: b.salon._id,
        salonTitle: b.salon.title,
        serviceId: String(b.svc._id),
        serviceName: b.svc.name,
        duration: b.svc.duration,
        price: b.svc.price,
        date: b.date,
        time: b.time,
        status: b.status,
        reference: makeRef(),
      })),
    );
    console.log(`Demo bookings seeded: ${sampleBookings.length}`);

    // ----- Promotions --------------------------------------------------------
    await Promotion.deleteMany({});
    await Promotion.insertMany([
      {
        title: 'Free Beard Trim with Any Cut',
        description: 'Receive a complimentary professional beard sculpting with any full haircut service.',
        code: 'TRIM24', expiry: new Date(Date.now() + 30 * 86400e3), discountPercent: 0, active: true,
      },
      {
        title: '20% Off Premium Products',
        description: 'Discount on the exclusive line of premium pomades, oils, and styling waxes.',
        code: 'GROOM20', expiry: new Date(Date.now() + 21 * 86400e3), discountPercent: 20, active: true,
      },
      {
        title: 'Summer Refresh: 15% off',
        description: 'Limited summer discount on all services across partner salons.',
        code: 'SUMMER15', expiry: new Date(Date.now() + 45 * 86400e3), discountPercent: 15, active: true,
      },
      {
        title: 'Loyalty Boost Weekend',
        description: 'Earn double loyalty points on any service this Saturday and Sunday.',
        code: 'DOUBLE2X', expiry: new Date(Date.now() + 7 * 86400e3), discountPercent: 0, active: true,
      },
    ]);
    console.log('Promotions seeded: 4');

    // ----- Notifications (mix of broadcast + targeted to demo) --------------
    await Notification.deleteMany({});
    await Notification.insertMany([
      {
        user: demo._id,
        title: 'Appointment Confirmed',
        message: `Your booking at ${salons[0].title} on ${dateLabel(2)} at 14:00 is confirmed.`,
        icon: 'calendar', iconColor: '#F1BA0D',
      },
      {
        user: demo._id,
        title: 'Loyalty Points Earned',
        message: 'You just earned 100 points from your last visit. Keep going to unlock Diamond tier.',
        icon: 'star', iconColor: '#FFA77F',
      },
      {
        title: 'New: Summer Refresh',
        message: 'Limited-time 15% off all services. Tap to view eligible salons.',
        icon: 'pricetag', iconColor: '#FFA77F',
        broadcast: true,
      },
      {
        title: 'Welcome to HedPop',
        message: 'Thanks for joining! Book your first service for 10% off using code WELCOME10.',
        icon: 'gift', iconColor: '#F1BA0D',
        broadcast: true,
      },
    ]);
    console.log('Notifications seeded: 4');

    console.log('\n✅ Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
