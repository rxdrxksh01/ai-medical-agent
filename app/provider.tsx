"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext'
export type UsersDetails={
    name:string,
    email:string,
    credits:number

}
export function Provider({ children }: { children: React.ReactNode }) 
{

const {user} = useUser();
const[userDetails,setUserDetails] = useState<any>()
useEffect(()=>{
    user&&CreateNewUser()
},[user])
    
const CreateNewUser = async () => {
  const result = await axios.post('/api/users');
  console.log(result.data);
  setUserDetails(result.data);
}

return (
  <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
    {children}
  </UserDetailContext.Provider>
);

}