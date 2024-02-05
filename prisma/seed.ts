import {PrismaClient, Role} from '@prisma/client'
import {createPasswordHash} from '../app/utils/misc'

const prisma = new PrismaClient()

async function seed() {
	await prisma.user.deleteMany()
	await prisma.media.deleteMany()
	await prisma.transaction.deleteMany()
	await prisma.payment.deleteMany()
	await prisma.admin.deleteMany()

	await prisma.user.create({
		data: {
			email: 'user@app.com',
			name: 'Demo User',
			passwordHash: await createPasswordHash('password'),
			role: Role.USER,
		},
	})

	await prisma.user.create({
		data: {
			email: 'admin@app.com',
			name: 'Admin User',
			passwordHash: await createPasswordHash('password'),
			role: Role.ADMIN,
		},
	})

	await prisma.media.createMany({
		data: [
			{
				title: 'The Fault in Our Stars',
				author: 'John Green',
				publisher: 'Penguin Books',
				description: 'The Fault in Our Stars is a novel by John Green.',
				rentPerDay: 3,
				category: {
					set: ['Action', 'Sci-Fi'],
				},
			},
		],
	})

	// await prisma.transaction.create({
	// 	data: {
	// 		user: {
	// 			connect: {
	// 				id: user.id,
	// 			},
	// 		},
	// 		media: {
	// 			connect: {
	// 				id: media.id,
	// 			},
	// 		},
	// 		borrowedAt: new Date(),
	// 		returnedAt: new Date(Date.now() + 6048e5 + 864e5),
	// 		link: {
	// 			create: {
	// 				mediaId: media.id,
	// 				expired: true,
	// 			},
	// 		},
	// 		payment: {
	// 			create: {
	// 				amount: 10,
	// 				method: PaymentMethod.CREDIT_CARD,
	// 				status: 'PAID',
	// 			},
	// 		},
	// 	},
	// })
	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
