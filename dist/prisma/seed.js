"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcryptjs"));
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@techcrowd.io' },
        update: {},
        create: {
            email: 'admin@techcrowd.io',
            passwordHash: adminHash,
            name: 'Admin',
            role: 'ADMIN',
            emailVerified: true,
        },
    });
    const creatorHash = await bcrypt.hash('creator123', 12);
    const sarah = await prisma.user.upsert({
        where: { email: 'sarah@example.com' },
        update: {},
        create: {
            email: 'sarah@example.com',
            passwordHash: creatorHash,
            name: 'Sarah Chen',
            bio: 'AI researcher and founder. Building the future of databases.',
            role: 'CREATOR',
            emailVerified: true,
        },
    });
    const marcus = await prisma.user.upsert({
        where: { email: 'marcus@example.com' },
        update: {},
        create: {
            email: 'marcus@example.com',
            passwordHash: creatorHash,
            name: 'Marcus Rivera',
            bio: 'Full-stack developer passionate about developer tools.',
            role: 'CREATOR',
            emailVerified: true,
        },
    });
    const aisha = await prisma.user.upsert({
        where: { email: 'aisha@example.com' },
        update: {},
        create: {
            email: 'aisha@example.com',
            passwordHash: creatorHash,
            name: 'Aisha Patel',
            bio: 'Open source advocate and indie developer.',
            role: 'CREATOR',
            emailVerified: true,
        },
    });
    const backerHash = await bcrypt.hash('backer123', 12);
    const backer = await prisma.user.upsert({
        where: { email: 'backer@example.com' },
        update: {},
        create: {
            email: 'backer@example.com',
            passwordHash: backerHash,
            name: 'John Doe',
            role: 'BACKER',
            emailVerified: true,
        },
    });
    const neuralDb = await prisma.project.upsert({
        where: { slug: 'neuraldb-ai-database' },
        update: {},
        create: {
            title: 'NeuralDB',
            slug: 'neuraldb-ai-database',
            description: 'NeuralDB is an AI-powered database that writes its own queries. Simply describe what data you need in plain English, and NeuralDB translates it into optimized SQL. Built on top of PostgreSQL, it integrates seamlessly with your existing stack.\n\nKey Features:\n- Natural language to SQL translation\n- Automatic query optimization\n- Real-time performance monitoring\n- Compatible with all major ORMs\n- Self-healing indexes\n\nWe are building the future of how developers interact with databases. No more writing complex joins or debugging slow queries — just describe what you need.',
            shortDescription: 'AI-powered database that writes its own queries',
            category: 'AI_ML',
            status: 'ACTIVE',
            goalAmount: 60000,
            currentAmount: 48200,
            backerCount: 342,
            endDate: new Date('2026-04-15'),
            featured: true,
            creatorId: sarah.id,
        },
    });
    const devstack = await prisma.project.upsert({
        where: { slug: 'devstack-cli' },
        update: {},
        create: {
            title: 'DevStack CLI',
            slug: 'devstack-cli',
            description: 'DevStack CLI lets you spin up full-stack development environments in seconds. One command to set up React + Node + PostgreSQL + Redis — fully configured and ready to code.\n\nNo more spending hours on boilerplate. No more "works on my machine" issues.\n\nFeatures:\n- 50+ templates (Next.js, NestJS, Django, Rails, etc.)\n- Auto-configured Docker environments\n- Built-in database seeding\n- Hot reloading for all services\n- Team sharing with cloud sync',
            shortDescription: 'Spin up full-stack environments in seconds',
            category: 'DEVELOPER_TOOLS',
            status: 'ACTIVE',
            goalAmount: 30000,
            currentAmount: 23100,
            backerCount: 189,
            endDate: new Date('2026-04-08'),
            featured: true,
            creatorId: marcus.id,
        },
    });
    const openmetrics = await prisma.project.upsert({
        where: { slug: 'openmetrics-analytics' },
        update: {},
        create: {
            title: 'OpenMetrics',
            slug: 'openmetrics-analytics',
            description: 'OpenMetrics is a fully open-source analytics platform for modern SaaS products. Self-host your analytics and own your data.\n\nTired of paying $500/month for analytics? OpenMetrics gives you:\n- Real-time dashboards\n- Funnel analysis\n- Cohort tracking\n- A/B testing built-in\n- Privacy-first (GDPR compliant)\n- One-click deploy to Vercel/Railway',
            shortDescription: 'Open-source analytics for modern SaaS products',
            category: 'OPEN_SOURCE',
            status: 'ACTIVE',
            goalAmount: 20000,
            currentAmount: 15800,
            backerCount: 156,
            endDate: new Date('2026-05-01'),
            featured: true,
            creatorId: aisha.id,
        },
    });
    const pixelforge = await prisma.project.upsert({
        where: { slug: 'pixelforge-design' },
        update: {},
        create: {
            title: 'PixelForge',
            slug: 'pixelforge-design',
            description: 'PixelForge is a real-time collaborative design tool built for modern teams. Think Figma meets VS Code — with built-in design tokens, component libraries, and code export.\n\nDesign, prototype, and hand off — all in one tool.',
            shortDescription: 'Real-time collaborative design tool for teams',
            category: 'SAAS',
            status: 'ACTIVE',
            goalAmount: 75000,
            currentAmount: 67500,
            backerCount: 521,
            endDate: new Date('2026-03-20'),
            featured: true,
            creatorId: sarah.id,
        },
    });
    const chainguard = await prisma.project.upsert({
        where: { slug: 'chainguard-security' },
        update: {},
        create: {
            title: 'ChainGuard',
            slug: 'chainguard-security',
            description: 'ChainGuard is a smart contract security auditing platform. Upload your Solidity contracts and get instant vulnerability reports with fix suggestions.\n\nProtect your users and your reputation with automated security audits.',
            shortDescription: 'Smart contract security auditing platform',
            category: 'WEB3',
            status: 'ACTIVE',
            goalAmount: 50000,
            currentAmount: 31400,
            backerCount: 278,
            endDate: new Date('2026-04-25'),
            featured: true,
            creatorId: marcus.id,
        },
    });
    const tinyml = await prisma.project.upsert({
        where: { slug: 'tinyml-kit' },
        update: {},
        create: {
            title: 'TinyML Kit',
            slug: 'tinyml-kit',
            description: 'TinyML Kit makes machine learning on microcontrollers accessible to everyone. Our hardware kit + SDK lets you deploy ML models to Arduino and ESP32 in minutes.\n\nPerfect for IoT, robotics, and edge computing projects.',
            shortDescription: 'Machine learning on microcontrollers made easy',
            category: 'HARDWARE',
            status: 'ACTIVE',
            goalAmount: 45000,
            currentAmount: 42000,
            backerCount: 367,
            endDate: new Date('2026-03-15'),
            featured: true,
            creatorId: aisha.id,
        },
    });
    await prisma.reward.createMany({
        skipDuplicates: true,
        data: [
            {
                projectId: neuralDb.id,
                title: 'Early Supporter',
                description: 'Get a shoutout on our website and early access to the beta.',
                amount: 25,
                quantity: 500,
                claimed: 180,
            },
            {
                projectId: neuralDb.id,
                title: 'Pro License',
                description: 'Lifetime Pro license with all features unlocked. Includes priority support.',
                amount: 100,
                quantity: 200,
                claimed: 95,
            },
            {
                projectId: neuralDb.id,
                title: 'Team License',
                description: 'Team license for up to 10 developers. Includes onboarding call.',
                amount: 500,
                quantity: 50,
                claimed: 22,
            },
        ],
    });
    await prisma.reward.createMany({
        skipDuplicates: true,
        data: [
            {
                projectId: devstack.id,
                title: 'Backer Badge',
                description: 'Digital backer badge and access to our Discord community.',
                amount: 10,
            },
            {
                projectId: devstack.id,
                title: 'Pro Access',
                description: '1 year of Pro features including cloud sync and team templates.',
                amount: 50,
                quantity: 300,
                claimed: 120,
            },
        ],
    });
    await prisma.event.upsert({
        where: { slug: 'ai-builders-hackathon-2026' },
        update: {},
        create: {
            title: 'AI Builders Hackathon 2026',
            slug: 'ai-builders-hackathon-2026',
            description: 'Join 500+ developers for a 48-hour AI hackathon. Build innovative AI applications, compete for $50K in prizes, and network with industry leaders.\n\nTracks:\n- LLM Applications\n- Computer Vision\n- AI for Healthcare\n- Open Track\n\nSponsored by top AI companies. Meals and swag included.',
            type: 'HACKATHON',
            status: 'UPCOMING',
            location: 'San Francisco, CA',
            isVirtual: false,
            startDate: new Date('2026-03-22'),
            endDate: new Date('2026-03-24'),
            maxAttendees: 500,
        },
    });
    await prisma.event.upsert({
        where: { slug: 'open-source-summit-2026' },
        update: {},
        create: {
            title: 'Open Source Summit',
            slug: 'open-source-summit-2026',
            description: 'A virtual conference celebrating open source innovation. Hear from maintainers of the world\'s most popular projects, learn about sustainability, and discover new tools.\n\n20+ speakers. Free to attend.',
            type: 'WEBINAR',
            status: 'UPCOMING',
            isVirtual: true,
            meetingUrl: 'https://meet.example.com/oss-summit',
            startDate: new Date('2026-04-10'),
            endDate: new Date('2026-04-10'),
            maxAttendees: 2000,
        },
    });
    await prisma.event.upsert({
        where: { slug: 'indie-hacker-demo-day' },
        update: {},
        create: {
            title: 'Indie Hacker Demo Day',
            slug: 'indie-hacker-demo-day',
            description: 'Indie developers showcase their products to investors, press, and the community. 10 selected projects get 5 minutes on stage.\n\nNetwork with fellow indie hackers and potential investors.',
            type: 'DEMO_DAY',
            status: 'UPCOMING',
            location: 'New York, NY',
            isVirtual: false,
            startDate: new Date('2026-04-18'),
            endDate: new Date('2026-04-18'),
            maxAttendees: 300,
        },
    });
    await prisma.comment.createMany({
        skipDuplicates: true,
        data: [
            {
                content: 'This is exactly what I\'ve been looking for! The natural language query feature is game-changing.',
                userId: backer.id,
                projectId: neuralDb.id,
            },
            {
                content: 'Love the concept. How does it handle complex multi-table joins?',
                userId: marcus.id,
                projectId: neuralDb.id,
            },
            {
                content: 'DevStack saved me hours of setup time. Can\'t wait for the cloud sync feature!',
                userId: backer.id,
                projectId: devstack.id,
            },
        ],
    });
    console.log('✅ Seed data created successfully!');
    console.log('');
    console.log('Test accounts:');
    console.log('  Admin:   admin@techcrowd.io / admin123');
    console.log('  Creator: sarah@example.com / creator123');
    console.log('  Creator: marcus@example.com / creator123');
    console.log('  Backer:  backer@example.com / backer123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map