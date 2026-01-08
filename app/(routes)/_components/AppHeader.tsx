import React from 'react'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const menuOptions = [
    {
        id: 1,
        name: 'Dashboard',
        path: '/dashboard'
    },
    {
        id: 2,
        name: 'History',
        path: '/dashboard/history'
    },
    {
        id: 3,
        name: 'Pricing',
        path: '/pricing'
    },
    {
        id: 4,
        name: 'Profile',
        path: '/profile'
    }
]

export default function AppHeader() {
    return (
        <div className='flex items-center justify-between p-4 shadow-sm px-10 md:px-20 lg:px-40 bg-white sticky top-0 z-50'>
            <Link href="/dashboard">
                <Image src={'/logo.svg'} alt='logo' width={150} height={70} className='cursor-pointer' />
            </Link>
            <div className='hidden md:flex gap-10 items-center'>
                {menuOptions.map((option) => (
                    <Link key={option.id} href={option.path} className='text-gray-600 hover:text-primary hover:font-bold transition-all cursor-pointer'>
                        {option.name}
                    </Link>
                ))}
            </div>
            <UserButton />
        </div>
    )
}
