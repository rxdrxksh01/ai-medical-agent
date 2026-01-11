'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface DoctorMatch {
    id: number
    specialist: string
    description: string
    image: string
    matchScore: number
    reasoning: string
}

interface DoctorSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    matchedDoctors: DoctorMatch[]
    sessionId: number
}

export function DoctorSelectionDialog({
    open,
    onOpenChange,
    matchedDoctors,
    sessionId
}: DoctorSelectionDialogProps) {
    const router = useRouter()
    const [selectedDoctor, setSelectedDoctor] = React.useState<number | null>(null)
    const [isNavigating, setIsNavigating] = React.useState(false)

    const handleDoctorSelect = async (doctorId: number) => {
        try {
            setSelectedDoctor(doctorId)
            setIsNavigating(true)

            // Update session with selected doctor
            const response = await fetch('/api/sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    selectedDoctorId: doctorId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update session')
            }

            // Navigate to medical agent page
            router.push(`/dashboard/medical-agent/${sessionId}`)
        } catch (error) {
            console.error('Error selecting doctor:', error)
            setIsNavigating(false)
            alert('Failed to select doctor. Please try again.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='text-2xl'>Recommended Specialists</DialogTitle>
                    <DialogDescription>
                        Based on your symptoms, we recommend consulting with these specialists
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 mt-4'>
                    {matchedDoctors.map((doctor) => (
                        <div
                            key={doctor.id}
                            className={`border rounded-xl p-4 hover:border-primary transition-all cursor-pointer ${selectedDoctor === doctor.id ? 'border-primary bg-primary/5' : ''
                                }`}
                            onClick={() => !isNavigating && handleDoctorSelect(doctor.id)}
                        >
                            <div className='flex gap-4'>
                                <Image
                                    src={doctor.image}
                                    alt={doctor.specialist}
                                    width={100}
                                    height={100}
                                    className='rounded-lg object-cover h-24 w-24'
                                />
                                <div className='flex-1'>
                                    <div className='flex items-start justify-between'>
                                        <div>
                                            <h3 className='font-bold text-lg'>{doctor.specialist}</h3>
                                            <p className='text-sm text-gray-500 mt-1'>{doctor.description}</p>
                                        </div>
                                        <div className='flex flex-col items-end'>
                                            <div className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold'>
                                                {doctor.matchScore}% Match
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-3 bg-blue-50 p-3 rounded-lg'>
                                        <p className='text-sm text-blue-900'>
                                            <span className='font-semibold'>Why this specialist: </span>
                                            {doctor.reasoning}
                                        </p>
                                    </div>
                                    <Button
                                        className='mt-3 w-full'
                                        disabled={isNavigating}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDoctorSelect(doctor.id)
                                        }}
                                    >
                                        {isNavigating && selectedDoctor === doctor.id ? (
                                            <>
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                Starting Consultation...
                                            </>
                                        ) : (
                                            'Consult with this Specialist'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
