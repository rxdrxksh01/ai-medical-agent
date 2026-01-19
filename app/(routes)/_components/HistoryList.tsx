"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useState } from 'react'
import { AddNewSession } from './AddNewSession'

export function HistoryList(){
    const [historyList,setHistoryList] = useState([])
    return (
        <div className='mt-10'>
            {historyList.length==0?
            <div className='flex items-center flex-col justify-center p-7 border border-dashed rounded-2xl border-2'>
                <Image src={'/medical-assistance.png'} alt = 'empty' height={150} width= {150}/>
                <h2 className='font-bold text-xl mt-2'>No Recent Consultations</h2>
                <p>It looks like you haven't had any consultations yet. Start your first consultation to get medical assistance.</p>
               <AddNewSession/>
            </div>:<div>List</div>}
            </div>
        
    )
}