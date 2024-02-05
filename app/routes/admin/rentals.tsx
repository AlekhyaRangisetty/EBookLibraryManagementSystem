import {PlusIcon} from '@heroicons/react/24/solid'
import {
	Button,
	clsx,
	Modal,
	MultiSelect,
	Textarea,
	TextInput,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Media} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {ObjectId} from 'bson'
import * as React from 'react'
import {db} from '~/lib/prisma.server'
import {ManageMediaSchema} from '~/lib/zod.schema'
import {formatDate} from '~/utils/date'
import {useAdminData} from '~/utils/hooks'
import {badRequest} from '~/utils/misc.server'
import {formatList} from '~/utils/string'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

enum MODE {
	edit,
	add,
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageMediaSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageMediaSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {mediaId, ...rest} = fields
	const id = new ObjectId()

	await db.media.upsert({
		where: {
			id: mediaId || id.toString(),
		},
		update: {...rest},
		create: {...rest},
	})

	return json({
		success: true,
	})
}

export default function ManageMedia() {
	const fetcher = useFetcher<ActionData>()
	const {allTransactions} = useAdminData()

	const [media, setMedia] = React.useState<Media | null>(null)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, {open: openModal, close: closeModal}] =
		useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state === 'idle') {
			return
		}

		if (fetcher.data?.success) {
			setMedia(null)
			closeModal()
		}
	}, [closeModal, fetcher.data?.success, fetcher.state])

	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto sm:flex sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-semibold text-gray-900">Rentals</h1>
					</div>
				</div>

				<div className="mt-8 flex flex-col">
					<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
							<table className="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th
											scope="col"
											className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
										>
											User
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
										>
											Book
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
										>
											Borowwed At
										</th>

										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell"
										>
											Status
										</th>
										<th
											scope="col"
											className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
										>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{allTransactions.map(transaction => (
										<tr key={transaction.id}>
											<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
												{transaction.user.name}
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
												{transaction.media.title} ({transaction.media.author})
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
												{formatDate(transaction.borrowedAt)}
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
												{transaction.returnedAt ? 'Returned' : 'Borrowed'}
											</td>
											<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0 space-x-4">
												<div className="flex gap-6 items-center"></div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setMedia(null)
					closeModal()
				}}
				title={clsx({
					'Edit book': mode === MODE.edit,
					'Add book': mode === MODE.add,
				})}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="mediaId" value={media?.id} />

						<TextInput
							name="title"
							label="Title"
							defaultValue={media?.title}
							error={fetcher.data?.fieldErrors?.title}
							required
						/>

						<TextInput
							name="author"
							label="Author"
							defaultValue={media?.author}
							error={fetcher.data?.fieldErrors?.author}
							required
						/>

						<TextInput
							name="publisher"
							label="Publisher"
							defaultValue={media?.publisher}
							error={fetcher.data?.fieldErrors?.publisher}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							defaultValue={media?.description}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<TextInput
							name="rentPerDay"
							label="Rent per day"
							defaultValue={media?.rentPerDay}
							error={fetcher.data?.fieldErrors?.rentPerDay}
							required
						/>

						<MultiSelect
							name="category"
							label="Category"
							required
							data={[
								'Music',
								'Action',
								'Sci-Fi',
								'Documentary',
								'Rock',
								'Fantasy',
								'Adventure',
								'Contemporary',
								'Dystopian',
								'Mystery',
								'Horror',
								'Thriller',
								'Paranormal',
								'Historical fiction',
								'Science Fiction',
								'Childrens',
							]}
							defaultValue={media?.category}
							placeholder="Select categories"
							searchable
							error={fetcher.data?.fieldErrors?.category}
						/>

						<div className="flex items-center justify-end gap-4 mt-1">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setMedia(null)
									closeModal()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								{mode === MODE.edit ? 'Save' : 'Add'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
