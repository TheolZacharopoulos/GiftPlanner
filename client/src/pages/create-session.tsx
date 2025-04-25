import React from 'react'
import { useLocation } from 'wouter'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createSessionSchema } from '@shared/schema'
import { z } from 'zod'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { CreateSessionFormData, SessionCreationResponse } from '@/lib/types'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CreateSession() {
  const [_, setLocation] = useLocation()
  const { toast } = useToast()

  const form = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      organizerName: '',
      giftName: '',
      giftLink: '',
      giftPrice: 0,
      organizerContribution: 0,
      expectedParticipants: 1,
      organizerSecret: ''
    }
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateSessionFormData) => {
      const response = await apiRequest('POST', '/api/sessions', data);
      const result: SessionCreationResponse = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setLocation(`/session-created/${data.sessionId}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create session"
      });
    }
  });

  function onSubmit(data: CreateSessionFormData) {
    mutate(data);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create a Gift Session</h2>
        <p className="text-gray-600 dark:text-gray-300">Set up a new gift session for your friends to join.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organizerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="giftName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gift Name/Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="giftLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gift Link (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/gift" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="giftPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gift Price (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Contribution (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expectedParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Number of Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="50" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizerSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Secret Code</FormLabel>
                    <FormDescription>
                      You'll need this to access the session as the organizer later.
                    </FormDescription>
                    <FormControl>
                      <Input 
                        type="password" 
                        minLength={4} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
