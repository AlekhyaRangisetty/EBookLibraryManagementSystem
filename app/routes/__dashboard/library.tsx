import {Badge, Button} from '@mantine/core'
import type {Media} from '@prisma/client'
import {Role} from '@prisma/client'
import type {ActionArgs, LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {requireUser, requireUserId} from '~/lib/session.server'
import {rentMedia} from '~/lib/transaction.server'
import {useDashboardData, useOptionalUser} from '~/utils/hooks'
import {formatList} from '~/utils/string'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json({})
}

export const action = async ({request}: ActionArgs) => {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const mediaId = formData.get('mediaId')?.toString()

	if (!mediaId) {
		return null
	}

	return rentMedia({mediaId, userId})
		.then(() => redirect('/'))
		.catch(_e => {
			// handle error here
			return null
		})
}

export default function Library() {
	const {allMedia} = useDashboardData()

	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto sm:flex sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-semibold text-gray-900">Books</h1>
					</div>
				</div>

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
												Rental Price
											</th>
											<th
												scope="col"
												className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
											>
												Category
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
										{allMedia.map(m => (
											<MediaRow key={m.id} media={m} />
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

function MediaRow({media}: {media: Media}) {
	const fetcher = useFetcher<typeof action>()
	const {user} = useOptionalUser()
	const {rentedMedia} = useDashboardData()

	const rentMedia = (mediaId: Media['id']) => {
		fetcher.submit(
			{mediaId},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	const isRentedByUser = rentedMedia.some(m => m.media.id === media.id)
	const isSubmitting = fetcher.state !== 'idle'

	return (
		<tr>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
				{media.title}
			</td>
			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				${media.rentPerDay.toFixed(2)}
			</td>
			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				{formatList(media.category)}
			</td>
			<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
				{user ? (
					<div className="flex gap-6 items-center">
						{isRentedByUser ? (
							<Badge color="red">Already rented</Badge>
						) : (
							<Button
								variant="outline"
								size="xs"
								loading={isSubmitting}
								loaderPosition="right"
								onClick={() => rentMedia(media.id)}
							>
								Rent
								<span className="sr-only">, {media.title}</span>
							</Button>
						)}
					</div>
				) : null}
			</td>
		</tr>
	)
}
