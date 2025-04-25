import React from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

export default function Home() {
  const [_, setLocation] = useLocation()

  return (
    <div id="initial-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Organize Group Gifts Easily</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          GiftGroup helps you organize a perfect gift for a friend with everyone contributing their fair share.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-primary mb-4">
            <Plus className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">Create a Gift Session</h3>
          <p className="text-gray-600 dark:text-gray-300">Create a new gift session as an organizer and invite friends to contribute.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-secondary mb-4">
            <Users className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">Invite Participants</h3>
          <p className="text-gray-600 dark:text-gray-300">Share a unique link with friends to join your gift session.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-success-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">Collect Contributions</h3>
          <p className="text-gray-600 dark:text-gray-300">Everyone contributes their share secretly until the gift amount is reached.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button 
          className="px-6 py-6 text-base"
          onClick={() => setLocation('/create')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create a Gift Session
        </Button>
        
        <Button 
          variant="outline" 
          className="px-6 py-6 text-base"
          onClick={() => setLocation('/join')}
        >
          <Users className="h-5 w-5 mr-2" />
          Join a Gift Session
        </Button>
      </div>
      
      <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">How it works</h3>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-300">
          <li>The organizer creates a gift session with a gift, price, and their own contribution.</li>
          <li>Participants join through a shared link and contribute their amounts secretly.</li>
          <li>Once the target amount is reached, the organizer can see who contributed what.</li>
          <li>If more money is collected than needed, those who contributed the most get refunds.</li>
          <li>The organizer collects the money and purchases the gift!</li>
        </ol>
      </div>
    </div>
  )
}
