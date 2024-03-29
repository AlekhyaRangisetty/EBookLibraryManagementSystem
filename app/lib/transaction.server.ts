import type {
	Media,
	Transaction,
	User,
	PaymentMethod,
	Payment,
} from '@prisma/client'
import {PaymentStatus} from '@prisma/client'
import {dateDiffInDays} from '~/utils/date'
import {db} from './prisma.server'

export function getAllTransaction(userId: User['id']) {
	return db.transaction.findMany({
		where: {
			userId,
		},
		include: {
			media: true,
			user: true,
		},
	})
}

// const daysInMs = (days: number) => 1000 * 60 * 60 * 24 * days
export async function rentMedia({
	userId,
	mediaId,
}: {
	userId: User['id']
	mediaId: Media['id']
}) {
	const media = await db.media.findUnique({
		where: {
			id: mediaId,
		},
	})

	if (!media) {
		throw new Error(`Media not found`)
	}

	return db.transaction.create({
		data: {
			user: {
				connect: {
					id: userId,
				},
			},
			media: {
				connect: {
					id: mediaId,
				},
			},
			amount: media.rentPerDay,
			paymentStatus: PaymentStatus.UNPAID,
			borrowedAt: new Date(),
		},
	})
}

export async function returnMedia(transactionId: Transaction['id']) {
	const transaction = await db.transaction.findUniqueOrThrow({
		where: {
			id: transactionId,
		},
		include: {
			media: {
				select: {
					rentPerDay: true,
				},
			},
		},
	})

	const rentAmount =
		dateDiffInDays(new Date(transaction.borrowedAt), new Date()) *
		transaction.media.rentPerDay

	return db.transaction.update({
		where: {
			id: transactionId,
		},
		data: {
			returnedAt: new Date(),
			amount: rentAmount,
		},
	})
}

export async function clearDues({
	userId,
	paymentMethod,
	amount,
}: {
	userId: User['id']
	paymentMethod: PaymentMethod
	amount: Payment['amount']
}) {
	const allTransaction = await db.transaction.findMany({
		where: {userId},
	})

	if (allTransaction.length === 0) {
		throw new Error(`No transaction found`)
	}

	const transactionIdsWithDues = allTransaction
		.filter(t => t.paymentStatus === PaymentStatus.UNPAID)
		.map(transaction => ({
			id: transaction.id,
			amount: transaction.amount,
			paid: transaction.paid,
		}))

	let credit = amount
	for (const transaction of transactionIdsWithDues) {
		const amountPending = transaction.amount - transaction.paid

		if (credit <= 0) break

		if (credit >= amountPending) {
			await db.transaction.update({
				where: {
					id: transaction.id,
				},
				data: {
					paymentStatus: PaymentStatus.PAID,
					paid: credit,
				},
			})

			credit -= amountPending
			continue
		}

		await db.transaction.update({
			where: {
				id: transaction.id,
			},
			data: {
				paid: credit,
			},
		})

		credit = 0
	}

	return db.payment.create({
		data: {
			userId,
			amount,
			method: paymentMethod,
			status: PaymentStatus.PAID,
		},
	})
}
