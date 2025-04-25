import React, { useEffect, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { SessionWithParticipants } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function RemoveParticipant() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/session/:sessionId/remove-participant')
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

  const removeMutation = useMutation({
    mutationFn: async (participantId: number) => {
      return await apiRequest('DELETE', `/api/sessions/${sessionId}/participants/${participantId}`, {
        organizerSecret: secret
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "The participant has been removed.",
      })
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove participant"
      });
    }
  });

  const handleRemoveParticipant = (participantId: number) => {
    if (!secret) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not authenticated as the organizer"
      });
      return;
    }
    
    removeMutation.mutate(participantId);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Loading session details...</p>
      </div>
    )
  }

  if (isError || !session) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Error loading session. It may have been deleted or does not exist.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    )
  }

  // Filter out organizer from list
  const participants = session.participants.filter(p => !p.isOrganizer);

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Remove Participant</h2>
        <p className="text-gray-600 dark:text-gray-300">Select a participant to remove from the gift session.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Removing a participant will also remove their contribution. This action cannot be undone.
            </AlertDescription>
          </Alert>
          
          {participants.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-300">No participants to remove.</p>
            </div>
          ) : (
            <div className="mb-6 divide-y divide-gray-200 dark:divide-gray-700">
              {participants.map(participant => (
                <div key={participant.id} className="py-3 flex justify-between items-center">
                  <span className="text-gray-800 dark:text-gray-200">
                    {participant.name}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.id)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-right">
            <Button 
              variant="outline"
              onClick={() => setLocation(`/session/${sessionId}/organizer`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
