import React, { useEffect, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { EditGiftFormData, SessionWithParticipants } from '@/lib/types'

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
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const editGiftSchema = z.object({
  giftName: z.string().min(1, "Gift name is required"),
  giftLink: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  giftPrice: z.number().positive("Price must be positive"),
  organizerContribution: z.number().min(0, "Contribution must be non-negative")
});

export default function EditGift() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/session/:sessionId/edit')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [secret, setSecret] = useState<string | null>(null)

  const sessionId = params?.sessionId

  if (!sessionId) {
    return <div>Invalid URL parameters</div>
  }

  useEffect(() => {
    // Get the organizer secret from sessionStorage
    const storedSecret = sessionStorage.getItem(`organizer-secret-${sessionId}`)
    if (storedSecret) {
      setSecret(storedSecret)
    } else {
      // Redirect to organizer view which will handle authentication
      setLocation(`/session/${sessionId}/organizer`)
    }
  }, [sessionId, setLocation])

  const { data: session, isLoading, isError } = useQuery<SessionWithParticipants>({
    queryKey: [`/api/sessions/${sessionId}`],
  });

  const form = useForm<EditGiftFormData>({
    resolver: zodResolver(editGiftSchema),
    defaultValues: {
      giftName: '',
      giftLink: '',
      giftPrice: 0,
      organizerContribution: 0
    }
  })

  // Update form when session data is loaded
  useEffect(() => {
    if (session) {
      const organizer = session.participants.find(p => p.isOrganizer)
      
      form.reset({
        giftName: session.giftName,
        giftLink: session.giftLink || '',
        giftPrice: parseFloat(session.giftPrice.toString()),
        organizerContribution: organizer ? parseFloat(organizer.contribution.toString()) : 0
      })
    }
  }, [session, form])

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: EditGiftFormData) => {
      const response = await apiRequest('PUT', `/api/sessions/${sessionId}`, {
        ...data,
        organizerSecret: secret
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Gift details have been updated.",
      })
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] })
      setLocation(`/session/${sessionId}/organizer`)
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update gift details"
      });
    }
  });

  function onSubmit(data: EditGiftFormData) {
    if (!secret) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not authenticated as the organizer"
      });
      return;
    }
    
    mutate(data);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Loading session details...</p>
      </div>
    )
  }

  if (isError || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Error loading session. It may have been deleted or does not exist.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Gift Details</h2>
        <p className="text-gray-600 dark:text-gray-300">Update your gift information below.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation(`/session/${sessionId}/organizer`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
