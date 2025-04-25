import React, { useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, calculateSuggestedContribution } from '@/lib/utils'
import { SessionWithParticipants, ContributionFormData } from '@/lib/types'

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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Home, ExternalLink } from 'lucide-react'

const contributionSchema = z.object({
  contribution: z.number().positive("Contribution must be positive")
});

export default function ParticipantView() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/session/:sessionId/participant/:name')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [contributed, setContributed] = useState(false)
  const [contributionAmount, setContributionAmount] = useState(0)

  const sessionId = params?.sessionId
  const participantName = params?.name

  if (!sessionId || !participantName) {
    return <div>Invalid URL parameters</div>
  }

  const { data: session, isLoading, isError } = useQuery<SessionWithParticipants>({
    queryKey: [`/api/sessions/${sessionId}`],
  });

  // Check if participant has already contributed
  const { data: checkResult } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/participants/check/${encodeURIComponent(participantName)}`]
  });
  
  // Handle participant check result
  useEffect(() => {
    if (checkResult?.exists) {
      setContributed(true);
    }
  }, [checkResult]);

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contribution: 0
    }
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ContributionFormData) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/participants`, {
        name: participantName,
        contribution: data.contribution
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setContributed(true)
      setContributionAmount(data.contribution)
      toast({
        title: "Success!",
        description: "Your contribution has been recorded.",
      })
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit contribution"
      });
    }
  });

  function onSubmit(data: ContributionFormData) {
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
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Gift Session</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Session ID: {sessionId}
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gift Details</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gift</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {session.giftName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(session.giftPrice)}
                </p>
              </div>
              {session.giftLink && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Link</p>
                  <a 
                    href={session.giftLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-700 break-all flex items-center"
                  >
                    {session.giftLink}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {!contributed ? (
            <div id="participant-contribution-form">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Contribution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                How much would you like to contribute to this gift?
              </p>
              
              {session && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Suggested Contribution Range</h4>
                  {(() => {
                    const { min, recommended, max } = calculateSuggestedContribution(
                      session.giftPrice,
                      session.expectedParticipants
                    );
                    return (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Minimum</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(min)}</p>
                        </div>
                        <div className="border-x border-blue-200 dark:border-blue-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Recommended</p>
                          <p className="font-medium text-blue-700 dark:text-blue-300">{formatCurrency(recommended)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Maximum</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(max)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Once submitted, you cannot change your contribution amount. Contact the organizer if needed.
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contribution"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-lg mr-2">€</span>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0.01" 
                              step="0.01" 
                              placeholder="Enter amount"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isPending}
                  >
                    {isPending ? 'Submitting...' : 'Submit Contribution'}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-500 text-white mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Thank You!</h3>
              <p className="text-green-700 dark:text-green-300 mt-1">Your contribution has been recorded.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                The organizer will contact you when the gift is ready to be purchased.
              </p>
              
              <div className="mt-4 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  Your contribution: <span className="font-medium">{formatCurrency(contributionAmount)}</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-gray-50 dark:bg-gray-700 justify-end">
          <Button 
            variant="outline"
            onClick={() => setLocation('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
