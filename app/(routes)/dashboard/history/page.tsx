import { db } from '@/lib/db'
import { sessionsTable, usersTable } from '@/config/schema'
import { currentUser } from '@clerk/nextjs/server'
import { desc, eq } from 'drizzle-orm'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HistoryPage() {
    const user = await currentUser();

    if (!user) {
        return <div>Please log in to view history.</div>
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
        return <div>Email not found.</div>
    }

    // 1. Get User ID from DB
    const [dbUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

    if (!dbUser) {
        return <div className='p-10 text-center text-gray-500'>No history found. Create your first session!</div>
    }

    // 2. Get Sessions
    const sessions = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, dbUser.id))
        .orderBy(desc(sessionsTable.createdAt));

    return (
        <div className='p-6 md:px-20'>
            <h2 className='font-bold text-3xl mb-8'>Consultation History</h2>

            {sessions.length === 0 ? (
                <div className='text-center py-20 bg-gray-50 rounded-xl border border-dashed'>
                    <p className='text-gray-500 text-lg'>No consultations yet.</p>
                    <Link href="/dashboard">
                        <Button className='mt-4'>Start New Consultation</Button>
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {sessions.map((session) => {
                        // Parse matched doctors if it's stored as JSON
                        // Note: Drizzle jsonb returns unknown, usually needs casting or checking
                        const doctors = session.matchedDoctors as any[];
                        const firstDoctor = doctors && doctors.length > 0 ? doctors[0] : null;
                        const date = new Date(session.createdAt).toLocaleDateString();

                        return (
                            <div key={session.id} className='border rounded-xl p-5 hover:shadow-md transition-all bg-white flex flex-col'>
                                <div className='flex items-center gap-3 mb-4'>
                                    {firstDoctor && (
                                        <div className='relative w-12 h-12 rounded-full overflow-hidden bg-gray-100'>
                                            <Image
                                                src={firstDoctor.image || '/doctor1.png'}
                                                alt={firstDoctor.specialist || 'Doctor'}
                                                fill
                                                className='object-cover'
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className='font-bold text-lg'>{firstDoctor?.specialist || 'General Physician'}</h3>
                                        <p className='text-xs text-gray-500'>{date}</p>
                                    </div>
                                    <div className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold
                                        ${session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {session.status || 'Pending'}
                                    </div>
                                </div>

                                <div className='mb-4 flex-1'>
                                    {session.summary ? (
                                        <div>
                                            <p className='text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'>Medical Report</p>
                                            <p className='text-gray-700 text-sm line-clamp-4 whitespace-pre-line'>
                                                {session.summary.replace(/\*\*/g, '').replace(/^#+\s/gm, '')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className='text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'>Symptoms</p>
                                            <p className='text-gray-600 text-sm line-clamp-3'>
                                                {session.symptoms}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Link href={`/dashboard/medical-agent/${session.id}`} className='w-full'>
                                    <Button variant="outline" className='w-full'>
                                        View Consultation
                                    </Button>
                                </Link>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
