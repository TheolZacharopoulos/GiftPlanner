import React, { useEffect, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { joinSessionSchema } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { JoinSessionFormData, SessionWithParticipants } from '@/lib/types'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

export default function JoinSession() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/join')
  const { toast } = useToast()
  const queryParams = new URLSearchParams(window.location.search)
  const sessionIdFromUrl = queryParams.get('sessionId')
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [organizerSecret, setOrganizerSecret] = useState('')
  
  // Create a separate form for the non-organizer flow
  const form = useForm<JoinSessionFormData>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      sessionId: sessionIdFromUrl || '',
      name: '',
      isOrganizer: false,
      organizerSecret: ''
    }
  })

  // Check if session exists
  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: [`/api/sessions/${sessionIdFromUrl || 'unknown'}`],
    enabled: !!sessionIdFromUrl
  });

  // Handle validation for session ID and redirect if needed
  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Invalid Session",
        description: "The session ID provided does not exist."
      })
    }
  }, [isError, toast])

  // Participant mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JoinSessionFormData) => {
      // Participant flow - check if already exists
      const checkResponse = await fetch(`/api/sessions/${data.sessionId}/participants/check/${encodeURIComponent(data.name)}`);
      const checkResult = await checkResponse.json();
      
      if (checkResult.exists) {
        throw new Error("A participant with this name already exists in this session");
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Redirect to participant view
      setLocation(`/session/${data.sessionId}/participant/${encodeURIComponent(data.name)}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join session"
      });
    }
  });

  // Handle radio button change
  const handleOrganizerChange = (value: string) => {
    setIsOrganizer(value === 'true')
    form.setValue('isOrganizer', value === 'true')
  }

  // Handle form submission
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const sessionId = form.getValues('sessionId')
    
    if (!sessionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Session ID is required"
      })
      return
    }
    
    if (isOrganizer) {
      try {
        // Ensure the secret exists
        if (!organizerSecret) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Organizer secret is required"
          })
          return
        }
        
        // Directly validate and handle organizer login
        const response = await fetch(`/api/sessions/${sessionId}/validate-organizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            organizerSecret: organizerSecret
          }),
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Invalid organizer secret"
          })
          return
        }
        
        // Store the secret in session storage and redirect
        sessionStorage.setItem(`organizer-secret-${sessionId}`, organizerSecret)
        setLocation(`/session/${sessionId}/organizer`)
      } catch (error) {
        console.error("Error during organizer validation:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to validate organizer"
        })
      }
    } else {
      // For participants, validate and use the mutation
      const result = form.trigger()
      if (result) {
        mutate(form.getValues())
      }
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Join a Gift Session</h2>
        <p className="text-gray-600 dark:text-gray-300">Enter the session ID to join a gift group.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session ID</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!!sessionIdFromUrl}
                        placeholder="Enter session ID" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel htmlFor="user-type">Are you the organizer?</FormLabel>
                <RadioGroup
                  onValueChange={handleOrganizerChange}
                  defaultValue="false"
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="participant" />
                    <Label htmlFor="participant">No, I'm a participant</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="organizer" />
                    <Label htmlFor="organizer">Yes, I'm the organizer</Label>
                  </div>
                </RadioGroup>
              </div>

              {isOrganizer ? (
                <div className="space-y-3">
                  <FormLabel htmlFor="organizerSecret">Session Secret</FormLabel>
                  <input 
                    id="organizerSecret"
                    type="password" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={organizerSecret}
                    onChange={(e) => setOrganizerSecret(e.target.value)}
                    placeholder="Enter your secret code" 
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isPending || isLoading}>
                  {isPending ? 'Joining...' : 'Join Session'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
