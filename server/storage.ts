import { db } from "@db";
import { 
  sessions, 
  participants, 
  SessionInsert, 
  ParticipantInsert 
} from "@shared/schema";
import { nanoid } from "nanoid";
import { eq, and, sum } from "drizzle-orm";
import { z } from "zod";

export class Storage {
  // Session functions
  async createSession(sessionData: Omit<SessionInsert, "sessionId">): Promise<string> {
    const sessionId = nanoid(10);

    await db.insert(sessions).values({
      ...sessionData,
      sessionId,
      isComplete: false
    });

    // Insert organizer as a participant
    await db.insert(participants).values({
      sessionId,
      name: sessionData.organizerName,
      contribution: sessionData.organizerContribution,
      isOrganizer: true,
      refundAmount: 0
    });

    return sessionId;
  }

  async getSessionBySessionId(sessionId: string) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionId, sessionId),
      with: {
        participants: true
      }
    });
    return session;
  }

  async updateSession(sessionId: string, sessionData: Partial<Omit<SessionInsert, "sessionId">>) {
    await db.update(sessions)
      .set({ 
        ...sessionData,
        updatedAt: new Date()
      })
      .where(eq(sessions.sessionId, sessionId));
  }

  async deleteSession(sessionId: string) {
    // Delete all participants first (due to foreign key constraints)
    await db.delete(participants)
      .where(eq(participants.sessionId, sessionId));
    
    // Then delete the session
    await db.delete(sessions)
      .where(eq(sessions.sessionId, sessionId));
  }

  async validateOrganizer(sessionId: string, organizerSecret: string) {
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.sessionId, sessionId),
        eq(sessions.organizerSecret, organizerSecret)
      )
    });
    return !!session;
  }

  // Participant functions
  async addParticipant(participantData: ParticipantInsert) {
    const [participant] = await db.insert(participants)
      .values(participantData)
      .returning();
    
    await this.checkSessionCompletion(participantData.sessionId);
    
    return participant;
  }

  async getParticipantsBySessionId(sessionId: string) {
    return await db.query.participants.findMany({
      where: eq(participants.sessionId, sessionId),
      orderBy: participants.createdAt
    });
  }

  async removeParticipant(participantId: number) {
    const [participant] = await db.delete(participants)
      .where(eq(participants.id, participantId))
      .returning();
    
    if (participant) {
      await this.checkSessionCompletion(participant.sessionId);
    }
    
    return participant;
  }

  async participantExists(sessionId: string, name: string) {
    const participant = await db.query.participants.findFirst({
      where: and(
        eq(participants.sessionId, sessionId),
        eq(participants.name, name)
      )
    });
    return !!participant;
  }

  // Helper functions
  async checkSessionCompletion(sessionId: string) {
    // Get session details
    const session = await this.getSessionBySessionId(sessionId);
    if (!session) return;

    // Calculate total contributions
    const participantsList = await this.getParticipantsBySessionId(sessionId);
    const totalContributions = participantsList.reduce(
      (sum, p) => sum + Number(p.contribution), 
      0
    );
    
    const giftPrice = Number(session.giftPrice);
    
    if (totalContributions >= giftPrice && !session.isComplete) {
      // Mark session as complete
      await db.update(sessions)
        .set({ isComplete: true })
        .where(eq(sessions.sessionId, sessionId));
      
      // Calculate excess amount if any
      const excess = totalContributions - giftPrice;
      
      if (excess > 0) {
        // Sort participants by contribution (highest first)
        const sortedParticipants = [...participantsList].sort(
          (a, b) => Number(b.contribution) - Number(a.contribution)
        );
        
        // Distribute excess to top contributors
        let remainingExcess = excess;
        for (const participant of sortedParticipants) {
          if (remainingExcess <= 0) break;
          
          const refundAmount = Math.min(Number(participant.contribution), remainingExcess);
          remainingExcess -= refundAmount;
          
          await db.update(participants)
            .set({ refundAmount })
            .where(eq(participants.id, participant.id));
        }
      }
    }
  }
}

export const storage = new Storage();
