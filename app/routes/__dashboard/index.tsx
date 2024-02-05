import {LinkIcon} from '@heroicons/react/20/solid'
import {Badge, Button} from '@mantine/core'
import type {Transaction} from '@prisma/client'
import {PaymentMethod, Role} from '@prisma/client'
import type {ActionFunction, LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import {requireUser} from '~/lib/session.server'
import {clearDues, returnMedia} from '~/lib/transaction.server'
import {dateDiffInDays} from '~/utils/date'
import {useDashboardData} from '~/utils/hooks'
import type {DashboardLoaderData} from '../__dashboard'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json({user})
}

export const action: ActionFunction = async ({request}) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()

	switch (intent) {
		case 'returnMedia': {
			const transactionId = formData.get('transactionId')?.toString()

			if (!transactionId) {
				return null
			}

			return returnMedia(transactionId)
				.then(() => json({}))
				.catch(e => {
					// handle error
					console.log(e)

					return null
				})
		}

		case 'clearDue': {
			const userId = formData.get('userId')?.toString()
			const amount = formData.get('amount')?.toString()
			const paymentMethod = formData.get('paymentMethod')?.toString()

			if (!amount || !paymentMethod || !userId) {
				return null
			}

			await clearDues({
				userId,
				amount: Number(amount),
				paymentMethod: paymentMethod as PaymentMethod,
			})
			return redirect('/payment-history')
		}

		default:
			return null
	}
}

export default function Dashboard() {
	const {rentedMedia} = useDashboardData()

	return (
		<>
			<div className="flex flex-col gap-12">
				{/* Media Borrowed */}
				<div className="px-4 mt-6 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-semibold text-gray-900">
						Current Rentals
					</h1>

					{rentedMedia.length > 0 ? (
						<div className="mt-8 flow-root">
							<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
								<div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
									<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
										<table className="min-w-full divide-y divide-gray-300">
											<thead className="bg-gray-50">
												<tr>
													<th
														scope="col"
														className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
													>
														Title
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Rental (per day)
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Total Amount
													</th>
													<th
														scope="col"
														className="relative py-3.5 pl-3 pr-4 sm:pr-6"
													>
														<span className="sr-only">Actions</span>
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200 bg-white">
												{rentedMedia.map(media => (
													<MediaCard key={media.id} media={media} />
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					) : (
						<EmptyBorrowState />
					)}
				</div>
			</div>
		</>
	)
}

function MediaCard({
	media,
}: {
	media: DashboardLoaderData['rentedMedia'][number]
}) {
	const fetcher = useFetcher()
	const isSubmitting = fetcher.state !== 'idle'

	const returnMedia = (transactionId: Transaction['id']) => {
		return fetcher.submit(
			{
				intent: 'returnMedia',
				transactionId,
			},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	return (
		<tr>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
				{media.media.title}
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				${media.media.rentPerDay.toFixed(2)}
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				$
				{Math.abs(
					dateDiffInDays(new Date(), new Date(media.borrowedAt)) *
						media.media.rentPerDay
				)}
			</td>

			<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
				<Button
					disabled={isSubmitting}
					onClick={() => returnMedia(media.id)}
					size="xs"
					variant="outline"
				>
					Return
				</Button>
			</td>
		</tr>
	)
}

function EmptyBorrowState() {
	return (
		<div className="relative col-span-2 w-full border-2 border-gray-300 border-solid rounded-lg px-12 py-8 text-center xl:col-span-4 h-80 flex items-center justify-center bg-white">
			<p className="mt-1 text-sm text-gray-500 italic">
				No rented book found. Please rent a book to see it here.
			</p>
		</div>
	)
}
