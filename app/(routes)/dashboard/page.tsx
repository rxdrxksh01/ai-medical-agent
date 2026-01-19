import { db } from '@/lib/db'
import { sessionsTable, usersTable } from '@/config/schema'
import { currentUser } from '@clerk/nextjs/server'
import { desc, eq } from 'drizzle-orm'
import React from 'react'
import { HistoryList } from '../_components/HistoryList'
import { DoctorsAgentList } from '../_components/DoctorsAgentList'
import { AddNewSession } from '../_components/AddNewSession'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Dashboard() {
  const user = await currentUser();

  // Default to empty logic if no user (should be handled by middleware usually)
  let recentSession = null;

  if (user && user.primaryEmailAddress?.emailAddress) {
    const email = user.primaryEmailAddress.emailAddress;

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (dbUser) {
      const sessions = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, dbUser.id))
        .orderBy(desc(sessionsTable.createdAt))
        .limit(1);

      if (sessions.length > 0) {
        recentSession = sessions[0];
      }
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='font-bold text-2xl'>My Dashboard</h2>
        <AddNewSession />
      </div>

      {recentSession ? (
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Activity</h3>
          <div className='bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center'>
            {/* Doctor Image - reuse logic */}
            {(() => {
              const doctors = recentSession.matchedDoctors as any[];
              const firstDoctor = doctors && doctors.length > 0 ? doctors[0] : null;
              return (
                firstDoctor && (
                  <div className='relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0'>
                    <Image
                      src={firstDoctor.image || '/doctor1.png'}
                      alt={firstDoctor.specialist || 'Doctor'}
                      fill
                      className='object-cover'
                    />
                  </div>
                )
              )
            })()}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className='font-bold text-xl'>
                  {/* @ts-ignore */}
                  {recentSession.matchedDoctors?.[0]?.specialist || 'General Consultation'}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${recentSession.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {recentSession.status || 'Pending'}
                </span>
              </div>

              {/* @ts-ignore */}
              {recentSession.summary ? (
                <div>
                  <p className='text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'>Medical Report</p>
                  <p className='text-gray-700 text-sm line-clamp-3 whitespace-pre-line'>
                    {/* @ts-ignore */}
                    {recentSession.summary.replace(/\*\*/g, '').replace(/^#+\s/gm, '')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className='text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'>Symptoms</p>
                  <p className='text-gray-600 line-clamp-2 md:line-clamp-1'>
                    {recentSession.symptoms}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {new Date(recentSession.createdAt).toLocaleDateString()} • {new Date(recentSession.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <Link href={`/dashboard/medical-agent/${recentSession.id}`}>
              <Button>Continue Consultation</Button>
            </Link>
          </div>
        </div>
      ) : (
        <HistoryList /> // Shows empty state
      )
      }

      <div className="mt-8">
        <DoctorsAgentList />
      </div>

    </div >
  )
}