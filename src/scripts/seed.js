require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');

const SALONS = [
  { title: 'The Gentlemen Cuts', category: 'Barber', isOpen: true, distance: '1 km away', time: '9:00 AM - 8:00 PM', rating: 4.9, reviewsCount: 250, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033' },
  { title: 'The Cuts', category: 'Salon', isOpen: false, distance: '3.2 km away', time: '10:00 AM - 9:00 PM', rating: 4.7, reviewsCount: 180, image: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186' },
  { title: 'The Bearded Gent', category: 'Barber', isOpen: true, distance: '2 km away', time: '9:00 AM - 11:00 PM', rating: 4.8, reviewsCount: 320, image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f' },
  { title: 'The Royal Trim', category: 'Salon', isOpen: false, distance: '5 km away', time: '11:00 AM - 10:00 PM', rating: 4.9, reviewsCount: 500, image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f' },
];

const baseServices = [
  { name: 'Classic Haircut', price: 25, duration: '30 Mins', desc: 'Traditional cut with hot towel finish' },
  { name: 'Skin Fade', price: 45, duration: '40 Mins', desc: 'Modern fade with precision detailing' },
  { name: 'Beard Trim', price: 20, duration: '30 Mins', desc: 'Beard sculpting and shaping' },
  { name: 'Hot Towel Shave', price: 25, duration: '30 Mins', desc: 'Traditional straight-razor shave' },
];

(async () => {
  try {
    await connectDB();

    await Salon.deleteMany({});
    await Salon.insertMany(SALONS.map((s) => ({ ...s, services: baseServices })));

    const adminEmail = 'admin@hedpop.test';
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        passwordHash: await User.hashPassword('admin1234'),
        role: 'admin',
      });
      console.log(`Admin user: ${adminEmail} / admin1234`);
    }

    const demoEmail = 'demo@hedpop.test';
    const demoExists = await User.findOne({ email: demoEmail });
    if (!demoExists) {
      await User.create({
        name: 'Charles',
        email: demoEmail,
        passwordHash: await User.hashPassword('demo1234'),
        role: 'customer',
        phone: '+44 0987 654321',
        loyaltyPoints: 7890,
        tier: 'Premium Member',
      });
      console.log(`Demo customer: ${demoEmail} / demo1234`);
    }

    await Promotion.deleteMany({});
    await Promotion.insertMany([
      { title: 'Free Beard Trim', description: 'Complimentary beard sculpting with any full haircut.', code: 'TRIM24', expiry: new Date('2026-12-30'), discountPercent: 0 },
      { title: '20% Off Products', description: 'Discount on premium pomades, oils, and styling waxes.', code: 'GROOM20', expiry: new Date('2026-12-29'), discountPercent: 20 },
    ]);

    await Notification.deleteMany({});
    await Notification.insertMany([
      { title: 'Welcome to HedPop', message: 'Thanks for joining! Book your first service for 10% off.', icon: 'star', iconColor: '#FFA77F', broadcast: true },
    ]);

    console.log('Seed complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
