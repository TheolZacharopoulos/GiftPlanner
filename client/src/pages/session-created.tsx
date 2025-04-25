import React, { useEffect } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { buildJoinLink, formatCurrency, shareViaWhatsApp } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CopyButton } from '@/components/copy-button'
import { SessionWithParticipants } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, InfoIcon, Home } from 'lucide-react'

export default function SessionCreated() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/session-created/:sessionId')
  const { toast } = useToast()
  const sessionId = params?.sessionId

  const { data: session, isLoading, isError } = useQuery<SessionWithParticipants>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId
  });

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load session details. The session may not exist."
      })
      setLocation('/')
    }
  }, [isError, toast, setLocation])

  if (isLoading || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Loading session details...</p>
      </div>
    )
  }

  const joinLink = buildJoinLink(sessionId)

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(joinLink, session.giftName)
  }

  const handleGoToSession = () => {
    setLocation(`/session/${sessionId}/organizer`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500 text-white mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gift Session Created!</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Your session has been created successfully. Share the link below with your friends.
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session ID
            </label>
            <div className="flex">
              <Input 
                value={sessionId} 
                readOnly 
                className="rounded-r-none bg-muted" 
              />
              <CopyButton 
                value={sessionId}
                className="rounded-l-none"
                showIcon={false}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Participant Join Link
            </label>
            <div className="flex">
              <Input 
                value={joinLink} 
                readOnly 
                className="rounded-r-none bg-muted session-link" 
              />
              <CopyButton 
                value={joinLink}
                className="rounded-l-none"
                showIcon={false}
              />
            </div>
          </div>
          
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Remember your session secret!</AlertTitle>
            <AlertDescription>
              You'll need it to access the session as the organizer.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
            <Button 
              variant="outline"
              onClick={() => setLocation('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={handleShareWhatsApp}
              >
                Share via WhatsApp
              </Button>
              
              <Button onClick={handleGoToSession}>
                Go to Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
