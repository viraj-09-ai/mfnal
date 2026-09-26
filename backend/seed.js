const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const User = require('./src/models/User');
const Visitor = require('./src/models/Visitor');
const Pass = require('./src/models/Pass');
const CheckLog = require('./src/models/CheckLog');
const generateBadge = require('./src/utils/badgeGenerator');

const DEMO_PASSWORD = 'Password123!';

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        await User.deleteMany();
        await Visitor.deleteMany();
        await Pass.deleteMany();
        await CheckLog.deleteMany();

        const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

        const [admin, security, employee] = await User.create([
            { name: 'Ava Admin', email: 'admin@demo.com', password: hashedPassword, role: 'Admin' },
            { name: 'Sam Security', email: 'security@demo.com', password: hashedPassword, role: 'Security' },
            { name: 'Eve Employee', email: 'employee@demo.com', password: hashedPassword, role: 'Employee' }
        ]);

        const visitor = await Visitor.create({
            name: 'John Visitor',
            email: 'john.visitor@example.com',
            phone: '9999999999',
            registeredBy: employee._id
        });

        const pass = await Pass.create({
            visitorId: visitor._id,
            purpose: 'Interview',
            validUntil: new Date(new Date().setDate(new Date().getDate() + 1))
        });

        pass.qrCodeUrl = await QRCode.toDataURL(String(pass._id));
        pass.badgeUrl = await generateBadge({ visitor, pass });
        await pass.save();

        await CheckLog.create([
            { passId: pass._id, action: 'Check-In' },
            { passId: pass._id, action: 'Check-Out' }
        ]);

        console.log('Database seeded successfully!');
        console.log('--------------------------------------------------');
        console.log('Demo staff logins (password for all: ' + DEMO_PASSWORD + ')');
        console.log(`  Admin:    ${admin.email}`);
        console.log(`  Security: ${security.email}`);
        console.log(`  Employee: ${employee.email}`);
        console.log('--------------------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
