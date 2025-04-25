import fs from 'fs/promises';
import path from 'path';
import { 
  SessionInsert, 
  ParticipantInsert,
  Session,
  Participant 
} from "@shared/schema";
import { nanoid } from "nanoid";

// Helper functions to handle type conversions
function ensureString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function ensureStringOrNull(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function ensureNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function ensureBoolean(value: boolean | undefined): boolean {
  return value === true;
}

// Define the JSON data structure
interface JsonData {
  sessions: Array<Session & { participants: Participant[] }>;
  participants: Participant[];
  lastParticipantId: number;
}

// Initialize with empty data
const initialData: JsonData = {
  sessions: [],
  participants: [],
  lastParticipantId: 0
};

// File path for the JSON data
const dataFilePath = path.join(process.cwd(), 'data.json');

export class JsonStorage {
  private data: JsonData = initialData;
  private initialized = false;

  // Initialize storage by loading from file or creating a new file
  private async init() {
    if (this.initialized) return;
    
    try {
      // Try to read the existing file
      const fileContent = await fs.readFile(dataFilePath, 'utf8');
      this.data = JSON.parse(fileContent);
      this.initialized = true;
    } catch (error) {
      // If file doesn't exist, create it with initial data
      await this.save();
      this.initialized = true;
    }
  }

  // Save data to JSON file
  private async save() {
    await fs.writeFile(dataFilePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // Session functions
  async createSession(sessionData: Omit<SessionInsert, "sessionId">): Promise<string> {
    await this.init();
    const sessionId = nanoid(10);
    
    // Create new session with proper type conversions
    const newSession: Session = {
      id: this.data.sessions.length + 1,
      sessionId,
      giftName: sessionData.giftName,
      giftLink: ensureString(sessionData.giftLink),
      giftPrice: ensureString(sessionData.giftPrice),
      organizerName: sessionData.organizerName,
      organizerSecret: sessionData.organizerSecret,
      organizerContribution: ensureString(sessionData.organizerContribution),
      expectedParticipants: ensureNumber(sessionData.expectedParticipants),
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add session to data
    this.data.sessions.push({...newSession, participants: []});
    
    // Create organizer participant with proper type conversions
    this.data.lastParticipantId++;
    const newParticipant: Participant = {
      id: this.data.lastParticipantId,
      sessionId,
      name: sessionData.organizerName,
      contribution: ensureString(sessionData.organizerContribution),
      isOrganizer: true,
      refundAmount: ensureString(0),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add participant to data
    this.data.participants.push(newParticipant);
    
    // Add participant to session
    const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex !== -1) {
      this.data.sessions[sessionIndex].participants.push(newParticipant);
    }
    
    await this.save();
    return sessionId;
  }

  async getSessionBySessionId(sessionId: string) {
    await this.init();
    const session = this.data.sessions.find(s => s.sessionId === sessionId);
    return session || null;
  }

  async updateSession(sessionId: string, sessionData: Partial<Omit<SessionInsert, "sessionId">>) {
    await this.init();
    const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex !== -1) {
      // Process data with type conversions
      const processedData: Partial<Session> = {};
      
      if (sessionData.giftName !== undefined) {
        processedData.giftName = sessionData.giftName;
      }
      
      if (sessionData.giftLink !== undefined) {
        processedData.giftLink = ensureStringOrNull(sessionData.giftLink);
      }
      
      if (sessionData.giftPrice !== undefined) {
        processedData.giftPrice = ensureString(sessionData.giftPrice);
      }
      
      if (sessionData.organizerName !== undefined) {
        processedData.organizerName = sessionData.organizerName;
      }
      
      if (sessionData.organizerSecret !== undefined) {
        processedData.organizerSecret = sessionData.organizerSecret;
      }
      
      if (sessionData.organizerContribution !== undefined) {
        processedData.organizerContribution = ensureString(sessionData.organizerContribution);
      }
      
      if (sessionData.expectedParticipants !== undefined) {
        processedData.expectedParticipants = ensureNumber(sessionData.expectedParticipants);
      }
      
      // Update session data
      this.data.sessions[sessionIndex] = {
        ...this.data.sessions[sessionIndex],
        ...processedData,
        updatedAt: new Date()
      };
      
      await this.save();
    }
  }

  async deleteSession(sessionId: string) {
    await this.init();
    // Remove participants
    this.data.participants = this.data.participants.filter(p => p.sessionId !== sessionId);
    
    // Remove session
    this.data.sessions = this.data.sessions.filter(s => s.sessionId !== sessionId);
    
    await this.save();
  }

  async validateOrganizer(sessionId: string, organizerSecret: string) {
    await this.init();
    const session = this.data.sessions.find(
      s => s.sessionId === sessionId && s.organizerSecret === organizerSecret
    );
    return !!session;
  }

  // Participant functions
  async addParticipant(participantData: ParticipantInsert) {
    await this.init();
    
    // Create new participant with proper type conversions
    this.data.lastParticipantId++;
    const newParticipant: Participant = {
      id: this.data.lastParticipantId,
      sessionId: participantData.sessionId,
      name: participantData.name,
      contribution: ensureString(participantData.contribution),
      isOrganizer: ensureBoolean(participantData.isOrganizer),
      refundAmount: ensureString(participantData.refundAmount),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add participant to data
    this.data.participants.push(newParticipant);
    
    // Add participant to session
    const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === participantData.sessionId);
    if (sessionIndex !== -1) {
      this.data.sessions[sessionIndex].participants.push(newParticipant);
    }
    
    await this.save();
    
    // Check session completion
    await this.checkSessionCompletion(participantData.sessionId);
    
    return newParticipant;
  }

  async getParticipantsBySessionId(sessionId: string) {
    await this.init();
    return this.data.participants.filter(p => p.sessionId === sessionId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async removeParticipant(participantId: number) {
    await this.init();
    const participantIndex = this.data.participants.findIndex(p => p.id === participantId);
    
    if (participantIndex === -1) return null;
    
    const participant = this.data.participants[participantIndex];
    const { sessionId } = participant;
    
    // Remove participant from data
    this.data.participants.splice(participantIndex, 1);
    
    // Remove participant from session
    const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex !== -1) {
      const participantSessionIndex = this.data.sessions[sessionIndex].participants.findIndex(
        p => p.id === participantId
      );
      if (participantSessionIndex !== -1) {
        this.data.sessions[sessionIndex].participants.splice(participantSessionIndex, 1);
      }
    }
    
    await this.save();
    
    // Check session completion
    await this.checkSessionCompletion(sessionId);
    
    return participant;
  }

  async participantExists(sessionId: string, name: string) {
    await this.init();
    const participant = this.data.participants.find(
      p => p.sessionId === sessionId && p.name === name
    );
    return !!participant;
  }

  // Helper functions
  async checkSessionCompletion(sessionId: string) {
    await this.init();
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
      const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === sessionId);
      if (sessionIndex !== -1) {
        this.data.sessions[sessionIndex].isComplete = true;
      }
      
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
          
          // Convert refund amount to string and update
          const stringRefundAmount = ensureString(refundAmount);
          
          // Update participant refund amount
          const participantIndex = this.data.participants.findIndex(p => p.id === participant.id);
          if (participantIndex !== -1) {
            this.data.participants[participantIndex].refundAmount = stringRefundAmount;
          }
          
          // Update participant in session
          const sessionIndex = this.data.sessions.findIndex(s => s.sessionId === sessionId);
          if (sessionIndex !== -1) {
            const participantSessionIndex = this.data.sessions[sessionIndex].participants.findIndex(
              p => p.id === participant.id
            );
            if (participantSessionIndex !== -1) {
              this.data.sessions[sessionIndex].participants[participantSessionIndex].refundAmount = stringRefundAmount;
            }
          }
        }
      }
      
      await this.save();
    }
  }
}

export const jsonStorage = new JsonStorage();