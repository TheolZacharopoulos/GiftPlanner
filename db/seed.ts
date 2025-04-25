import { db } from "./index";
import { sessions, participants } from "@shared/schema";
import { nanoid } from "nanoid";

async function seed() {
  try {
    console.log("Seeding database...");

    // Create an example session
    const demoSessionId = nanoid(10);
    
    const [session] = await db.insert(sessions).values({
      sessionId: demoSessionId,
      giftName: "Wireless Headphones",
      giftPrice: 89.99,
      giftLink: "https://example.com/headphones",
      organizerName: "John Smith",
      organizerSecret: "demo123",
      organizerContribution: 25.00,
      expectedParticipants: 4,
      isComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log("Created demo session:", session);

    // Add organizer as participant
    const [organizer] = await db.insert(participants).values({
      sessionId: demoSessionId,
      name: "John Smith",
      contribution: 25.00,
      isOrganizer: true,
      refundAmount: 0,
      createdAt: new Date()
    }).returning();

    console.log("Added organizer:", organizer);

    // Add demo participants
    const demoParticipants = [
      {
        sessionId: demoSessionId,
        name: "Jane Doe",
        contribution: 20.00,
        isOrganizer: false,
        refundAmount: 0,
        createdAt: new Date()
      },
      {
        sessionId: demoSessionId,
        name: "Mike Johnson",
        contribution: 15.00,
        isOrganizer: false,
        refundAmount: 0,
        createdAt: new Date()
      },
      {
        sessionId: demoSessionId,
        name: "Sarah Williams",
        contribution: 30.00,
        isOrganizer: false,
        refundAmount: 0,
        createdAt: new Date()
      }
    ];

    const insertedParticipants = await db.insert(participants).values(demoParticipants).returning();
    console.log("Added participants:", insertedParticipants.length);

    console.log("Seeding complete!");
  } 
  catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
