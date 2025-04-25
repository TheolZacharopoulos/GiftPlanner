import React, { useEffect } from 'react'
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

  const form = useForm<JoinSessionFormData>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      sessionId: sessionIdFromUrl || '',
      name: '',
      isOrganizer: false,
      organizerSecret: ''
    }
  })

  const isOrganizer = form.watch('isOrganizer')

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

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JoinSessionFormData) => {
      // If organizer, just validate the secret
      if (data.isOrganizer) {
        const response = await apiRequest('POST', `/api/sessions/${data.sessionId}/validate-organizer`, {
          organizerSecret: data.organizerSecret
        });
        const result = await response.json();
        
        // Store the secret in session storage for future use
        if (response.ok) {
          sessionStorage.setItem(`organizer-secret-${data.sessionId}`, data.organizerSecret || '');
        } else {
          throw new Error(result.error || "Invalid organizer secret");
        }
        
        return data;
      } 
      // If participant, check if already exists
      else {
        const checkResponse = await fetch(`/api/sessions/${data.sessionId}/participants/check/${encodeURIComponent(data.name)}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
          throw new Error("A participant with this name already exists in this session");
        }
        
        return data;
      }
    },
    onSuccess: (data) => {
      if (data.isOrganizer) {
        // Redirect to organizer view
        setLocation(`/session/${data.sessionId}/organizer`);
      } else {
        // Redirect to participant view
        setLocation(`/session/${data.sessionId}/participant/${encodeURIComponent(data.name)}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join session"
      });
    }
  });

  function onSubmit(data: JoinSessionFormData) {
    mutate(data);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="isOrganizer"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Are you the organizer?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'true')}
                        defaultValue={field.value ? 'true' : 'false'}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isOrganizer ? (
                <FormField
                  control={form.control}
                  name="organizerSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder="Enter your secret code" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
