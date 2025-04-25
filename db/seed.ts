import { storage } from "../server/storage";
import { nanoid } from "nanoid";

async function seed() {
  try {
    console.log("Seeding data storage...");

    // Create an example session
    const demoSessionId = await storage.createSession({
      giftName: "Wireless Headphones",
      giftPrice: 89.99,
      giftLink: "https://example.com/headphones",
      organizerName: "John Smith",
      organizerSecret: "demo123",
      organizerContribution: 25.00,
      expectedParticipants: 4
    });
    
    console.log("Created demo session:", demoSessionId);

    // The organizer is automatically added as a participant by the storage adapter,
    // so we don't need to add them separately

    // Add demo participants
    const demoParticipants = [
      {
        sessionId: demoSessionId,
        name: "Jane Doe",
        contribution: 20.00,
        isOrganizer: false,
        refundAmount: 0
      },
      {
        sessionId: demoSessionId,
        name: "Mike Johnson",
        contribution: 15.00,
        isOrganizer: false,
        refundAmount: 0
      },
      {
        sessionId: demoSessionId,
        name: "Sarah Williams",
        contribution: 30.00,
        isOrganizer: false,
        refundAmount: 0
      }
    ];

    for (const participantData of demoParticipants) {
      await storage.addParticipant(participantData);
    }
    console.log("Added participants:", demoParticipants.length);

    // Mark the session as complete (this would normally be done automatically by the
    // checkSessionCompletion function, but we're forcing it here for demo purposes)
    await storage.updateSession(demoSessionId, {
      isComplete: true
    });

    console.log("Seeding complete!");
  } 
  catch (error) {
    console.error("Error seeding data storage:", error);
  }
}

seed();
