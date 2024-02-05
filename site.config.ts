const siteConfig = {
	appName: 'eLMS Application',
	noOfDaysToReturn: 7,
	publicLinks: [],
	navigationLinks: [
		{name: 'Library', href: '/library'},
		{name: 'Current Rentals', href: '/'},
		{name: 'Rental History', href: '/rental-history'},
		{name: 'Payment History', href: '/payment-history'},
	],
	adminLinks: [
		{name: 'Books', href: '/admin'},
		{
			name: 'Rentals',
			href: '/admin/rentals',
		},
	],
}

export default siteConfig
