'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, Loader2 } from 'lucide-react'
import { DoctorSelectionDialog } from '@/app/(routes)/_components/DoctorSelectionDialog'

interface DoctorMatch {
    id: number
    specialist: string
    description: string
    image: string
    matchScore: number
    reasoning: string
}

export function AddNewSession() {
    const [note, setNote] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [showDoctorSelection, setShowDoctorSelection] = useState(false)
    const [matchedDoctors, setMatchedDoctors] = useState<DoctorMatch[]>([])
    const [sessionId, setSessionId] = useState<number | null>(null)
    const [showInitialDialog, setShowInitialDialog] = useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null;

    const handleNext = async () => {
        if (!note.trim()) return

        try {
            setIsLoading(true)

            // Create session and get matched doctors
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms: note })
            })

            if (!response.ok) {
                throw new Error('Failed to create session')
            }

            const data = await response.json()

            setSessionId(data.sessionId)
            setMatchedDoctors(data.matchedDoctors)

            // Close initial dialog and show doctor selection
            setShowInitialDialog(false)
            setShowDoctorSelection(true)
        } catch (error) {
            console.error('Error creating session:', error)
            alert('Failed to analyze symptoms. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={showInitialDialog} onOpenChange={setShowInitialDialog}>
                <DialogTrigger asChild>
                    <Button className='mt-4'>+ Start Consultation</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Basic Details</DialogTitle>
                        <DialogDescription asChild>
                            <div>
                                <h2>Add symptoms or Any other Details</h2>
                                <Textarea
                                    placeholder='Add Detail here..'
                                    className='h-[200px] mt-1'
                                    onChange={(e) => setNote(e.target.value)}
                                    value={note}
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex gap-2'>
                        <DialogClose asChild>
                            <Button variant={'outline'} disabled={isLoading}>Cancel</Button>
                        </DialogClose>
                        <Button
                            disabled={!note || isLoading}
                            onClick={handleNext}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Next <ArrowRight />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DoctorSelectionDialog
                open={showDoctorSelection}
                onOpenChange={setShowDoctorSelection}
                matchedDoctors={matchedDoctors}
                sessionId={sessionId || 0}
            />
        </>
    )
}
