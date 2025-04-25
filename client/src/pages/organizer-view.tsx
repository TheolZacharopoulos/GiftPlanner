import React, { useState, useEffect } from 'react'
import { useLocation, useRoute } from 'wouter'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { formatCurrency, calculateProgress, buildJoinLink, shareViaWhatsApp, shareViaEmail } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CopyButton } from '@/components/copy-button'
import { SessionWithParticipants } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  AlertCircle, 
  PenSquare, 
  Info, 
  Home, 
  Share2, 
  ExternalLink, 
  UserMinus, 
  X, 
  CheckCircle2 
} from 'lucide-react'

export default function OrganizerView() {
  const [_, setLocation] = useLocation()
  const [match, params] = useRoute('/session/:sessionId/organizer')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const sessionId = params?.sessionId

  if (!sessionId) {
    return <div>Invalid URL parameters</div>
  }

  useEffect(() => {
    // Try to get the secret from sessionStorage
    const storedSecret = sessionStorage.getItem(`organizer-secret-${sessionId}`)
    if (storedSecret) {
      setSecret(storedSecret)
    } else {
      setShowLoginModal(true)
    }
  }, [sessionId])

  const { data: session, isLoading, isError, refetch } = useQuery<SessionWithParticipants>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId
  });

  const handleSecretSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const secretInput = formData.get('organizerSecret') as string
    
    try {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/validate-organizer`, {
        organizerSecret: secretInput
      });
      
      // If we get here, validation was successful
      setSecret(secretInput)
      sessionStorage.setItem(`organizer-secret-${sessionId}`, secretInput)
      setShowLoginModal(false)
      toast({
        title: "Success!",
        description: "You've been authenticated as the organizer.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "The secret you entered is incorrect."
      });
    }
  }

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/sessions/${sessionId}`, {
        organizerSecret: secret
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "The session has been closed and all data deleted.",
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close the session"
      });
      setIsDeleting(false);
    }
  });

  const handleCloseSession = () => {
    setShowDeleteModal(true);
  };

  const confirmCloseSession = () => {
    setIsDeleting(true);
    setShowDeleteModal(false);
    closeSessionMutation.mutate();
  };

  if (isLoading || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Loading session details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p>Error loading session. It may have been deleted or does not exist.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  const totalContributed = session.participants.reduce(
    (sum, p) => sum + parseFloat(p.contribution.toString()), 
    0
  );
  
  const targetAmount = parseFloat(session.giftPrice.toString());
  const progressPercentage = calculateProgress(totalContributed, targetAmount);
  const joinLink = buildJoinLink(sessionId);
  
  const organizer = session.participants.find(p => p.isOrganizer);
  const otherParticipants = session.participants.filter(p => !p.isOrganizer);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">Gift Session</CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Session ID: {sessionId}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/session/${sessionId}/edit`)}
                >
                  <PenSquare className="h-4 w-4 mr-1" />
                  Edit
                </Button>
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
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Collection Progress</h3>
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(totalContributed)} of {formatCurrency(targetAmount)}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {progressPercentage}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2.5" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Participants</h3>
                    <Badge variant={session.isComplete ? "success" : "secondary"}>
                      {session.isComplete ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                  
                  {!session.isComplete ? (
                    <div id="participants-before-complete">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4 flex">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p className="ml-3 text-sm text-blue-700 dark:text-blue-300">
                          Individual contributions will be visible once the target amount is reached.
                        </p>
                      </div>
                      
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {otherParticipants.map(participant => (
                          <div key={participant.id} className="py-3 flex justify-between items-center">
                            <span className="text-gray-800 dark:text-gray-200">
                              {participant.name}
                            </span>
                            <Badge>Contributed</Badge>
                          </div>
                        ))}
                        
                        {organizer && (
                          <div className="py-3 flex justify-between items-center">
                            <span className="text-gray-800 dark:text-gray-200">
                              {organizer.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                Organizer
                              </Badge>
                              <Badge>Contributed</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div id="participants-after-complete">
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mb-4 flex">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="ml-3 text-sm text-green-700 dark:text-green-300">
                          The target amount has been reached. You can now collect the contributions and buy the gift.
                        </p>
                      </div>
                      
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {otherParticipants.map(participant => (
                          <div key={participant.id} className="py-3 flex justify-between items-center">
                            <span className="text-gray-800 dark:text-gray-200">
                              {participant.name}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(participant.contribution)}
                              {parseFloat(participant.refundAmount.toString()) > 0 && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Refund: {formatCurrency(participant.refundAmount)})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                        
                        {organizer && (
                          <div className="py-3 flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-gray-800 dark:text-gray-200">
                                {organizer.name}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                Organizer
                              </Badge>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(organizer.contribution)}
                              {parseFloat(organizer.refundAmount.toString()) > 0 && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Refund: {formatCurrency(organizer.refundAmount)})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 dark:bg-gray-700 justify-end">
                <Button 
                  variant="destructive"
                  onClick={handleCloseSession}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Closing...' : 'Close Session'}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Share Session</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participant Join Link
                  </label>
                  <div className="flex">
                    <Input 
                      value={joinLink} 
                      readOnly 
                      className="rounded-r-none bg-muted text-sm session-link" 
                    />
                    <CopyButton 
                      value={joinLink}
                      className="rounded-l-none"
                      showIcon={false}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => shareViaWhatsApp(joinLink, session.giftName)}
                  >
                    Share via WhatsApp
                  </Button>
                  
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    onClick={() => shareViaEmail(joinLink, session.giftName)}
                  >
                    Share via Email
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation('/')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation(`/session/${sessionId}/remove-participant`)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Participant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Organizer Login Modal */}
      <AlertDialog open={showLoginModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Organizer Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your organizer secret to access this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleSecretSubmit}>
            <div className="mb-4">
              <label htmlFor="organizerSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret Code
              </label>
              <Input
                id="organizerSecret"
                name="organizerSecret"
                type="password"
                required
                placeholder="Enter your secret code"
              />
            </div>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Session Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this gift session? This will permanently delete all session data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCloseSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
