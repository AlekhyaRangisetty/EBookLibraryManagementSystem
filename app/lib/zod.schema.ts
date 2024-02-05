import {z} from 'zod'

const name = z.string().min(1, 'Name is required')
const email = z.string().email('Invalid email')
const password = z.string().min(8, 'Password must be at least 8 characters')

export const LoginSchema = z.object({
	email,
	password,
	remember: z.enum(['on']).optional(),
	redirectTo: z.string().optional(),
	// role: z.nativeEnum(UserRole),
})

export const RegisterUserSchema = z
	.object({
		name,
		email,
		password,
		confirmPassword: password,
	})
	.refine(data => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['password', 'confirmPassword'],
	})

export const ManageMediaSchema = z.object({
	mediaId: z.string().optional(),
	title: z.string().min(1, 'Title is required'),
	category: z
		.string()
		.min(1, 'Category is required')
		.transform(value => value.split(',')),
	rentPerDay: z.preprocess(
		Number,
		z.number().min(1, 'Rent per day is required')
	),
	author: z.string().min(1, 'Author is required'),
	publisher: z.string().min(1, 'Publisher is required'),
	description: z.string().min(1, 'Description is required'),
})
