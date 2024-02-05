import {Menu, Transition} from '@headlessui/react'
import {ChevronRightIcon} from '@heroicons/react/24/outline'
import {LoaderArgs, SerializeFrom, json, redirect} from '@remix-run/node'
import {Form, NavLink, Outlet, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import siteConfig from 'site.config'
import {getAllMedia} from '~/lib/media.server'
import {db} from '~/lib/prisma.server'
import {isUser, requireUser} from '~/lib/session.server'
import {getAllTransaction} from '~/lib/transaction.server'
import {getAllNotAdminUsers} from '~/lib/user.server'
import {cx} from '~/utils/string'

export type DashboardLoaderData = SerializeFrom<typeof loader>

export type AdminLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (await isUser(request)) {
		return redirect('/')
	}

	const nonAdminUsers = await getAllNotAdminUsers()
	const allMedia = await getAllMedia()
	const allTransactions = await db.transaction.findMany({
		include: {
			media: true,
			user: true,
		},
	})

	return json({
		nonAdminUsers,
		user,
		allMedia,
		allTransactions,
	})
}

export default function DashboardLayout() {
	const {user} = useLoaderData<typeof loader>()

	return (
		<>
			<div className="min-h-full">
				{/* Static sidebar for desktop */}
				<div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:pt-5 lg:pb-4 lg:bg-gray-700">
					<div className="flex items-center flex-shrink-0 px-6">
						<img
							className="h-14 w-[70%] object-center object-cover"
							src="https://library.berklee.edu/sites/default/files/md-slider-image/LibLogo_collab.png"
							alt="Workflow"
						/>
					</div>
					{/* Sidebar component, swap this element with another sidebar if you like */}
					<div className="mt-6 h-0 flex-1 flex flex-col overflow-y-auto">
						{/* User account dropdown */}
						<Menu
							as="div"
							className="px-3 relative inline-block text-left mt-1"
						>
							<div>
								<Menu.Button className="group w-full bg-gray-100 rounded-md px-2 py-2 text-sm text-left font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-purple-500">
									<span className="flex w-full justify-between items-center">
										<span className="flex min-w-0 items-center justify-between space-x-3">
											<span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-500 text-white uppercase">
												{user.name.charAt(0)}
											</span>
											<span className="flex-1 flex flex-col min-w-0">
												<span className="text-gray-900 text-sm font-medium truncate">
													{user.name}
												</span>
												<span className="text-gray-500 text-sm truncate">
													{user.email}
												</span>
											</span>
										</span>
										<ChevronRightIcon
											className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
											aria-hidden="true"
										/>
									</span>
								</Menu.Button>
							</div>
							<Transition
								as={React.Fragment}
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95"
							>
								<Menu.Items className="z-10 mx-3 origin-top absolute right-0 left-0 mt-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-200 focus:outline-none">
									<div className="py-1">
										<Menu.Item>
											{({active}) => (
												<Form
													replace
													action="/auth/logout"
													method="post"
													className={cx(active ? 'bg-gray-100' : '')}
												>
													<button
														type="submit"
														className="block w-full px-4 py-2 text-left text-sm text-gray-700"
													>
														Logout
													</button>
												</Form>
											)}
										</Menu.Item>
									</div>
								</Menu.Items>
							</Transition>
						</Menu>

						{/* Navigation */}
						<nav className="px-3 mt-6">
							<div className="space-y-4">
								{siteConfig.adminLinks.map(item => (
									<NavLink
										to={item.href}
										key={item.name}
										prefetch="intent"
										end={item.href === '/'}
										className={({isActive}) =>
											cx(
												isActive
													? 'bg-white text-gray-900 font-bold'
													: 'bg-white/70 text-gray-500 hover:text-gray-900 hover:bg-gray-50',
												'group flex justify-center items-center px-2 py-2 text-sm rounded-md'
											)
										}
									>
										{item.name}
									</NavLink>
								))}
							</div>
						</nav>
					</div>
				</div>
				{/* Main column */}
				<div className="lg:pl-64 flex flex-col">
					<div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
						<div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
							<div className="flex-1" />
							<div className="flex items-center">
								{/* Profile dropdown */}
								<Menu as="div" className="ml-3 relative">
									<div>
										<Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
											<span className="sr-only">Open user menu</span>
											<span className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-500 text-white uppercase">
												{user.name.charAt(0)}
											</span>
										</Menu.Button>
									</div>

									<Transition
										as={React.Fragment}
										enter="transition ease-out duration-100"
										enterFrom="transform opacity-0 scale-95"
										enterTo="transform opacity-100 scale-100"
										leave="transition ease-in duration-75"
										leaveFrom="transform opacity-100 scale-100"
										leaveTo="transform opacity-0 scale-95"
									>
										<Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-200 focus:outline-none">
											<div className="py-1">
												<Menu.Item>
													{({active}) => (
														<Form
															replace
															action="/auth/logout"
															method="post"
															className={cx(active ? 'bg-gray-100' : '')}
														>
															<button
																type="submit"
																className="block w-full px-4 py-2 text-left text-sm text-gray-700"
															>
																Logout
															</button>
														</Form>
													)}
												</Menu.Item>
											</div>
										</Menu.Items>
									</Transition>
								</Menu>
							</div>
						</div>
					</div>

					<main className="flex-1">
						<Outlet />
					</main>
				</div>
			</div>
		</>
	)
}
