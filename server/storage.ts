// Import the JSON storage implementation
import { jsonStorage } from "./jsonStorage";
import { 
  SessionInsert, 
  ParticipantInsert 
} from "@shared/schema";

/**
 * Storage adapter class - this provides a consistent interface for storage
 * By using this wrapper class, you can easily switch between JSON and PostgreSQL
 * without changing the rest of your application code
 */
export class Storage {
  // Session functions
  async createSession(sessionData: Omit<SessionInsert, "sessionId">): Promise<string> {
    return jsonStorage.createSession(sessionData);
  }

  async getSessionBySessionId(sessionId: string) {
    return jsonStorage.getSessionBySessionId(sessionId);
  }

  async updateSession(sessionId: string, sessionData: Partial<Omit<SessionInsert, "sessionId">>) {
    return jsonStorage.updateSession(sessionId, sessionData);
  }

  async deleteSession(sessionId: string) {
    return jsonStorage.deleteSession(sessionId);
  }

  async validateOrganizer(sessionId: string, organizerSecret: string) {
    return jsonStorage.validateOrganizer(sessionId, organizerSecret);
  }

  // Participant functions
  async addParticipant(participantData: ParticipantInsert) {
    return jsonStorage.addParticipant(participantData);
  }

  async getParticipantsBySessionId(sessionId: string) {
    return jsonStorage.getParticipantsBySessionId(sessionId);
  }

  async removeParticipant(participantId: number) {
    return jsonStorage.removeParticipant(participantId);
  }

  async participantExists(sessionId: string, name: string) {
    return jsonStorage.participantExists(sessionId, name);
  }

  // Helper functions
  async checkSessionCompletion(sessionId: string) {
    return jsonStorage.checkSessionCompletion(sessionId);
  }
}

export const storage = new Storage();
