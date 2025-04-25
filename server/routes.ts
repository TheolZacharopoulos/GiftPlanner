import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createSessionSchema,
  joinSessionSchema,
  participantContributionSchema,
  editSessionSchema,
  removeParticipantSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new gift session
  app.post('/api/sessions', async (req, res) => {
    try {
      const validatedData = createSessionSchema.parse(req.body);
      const sessionId = await storage.createSession(validatedData);
      res.status(201).json({ sessionId });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get session details
  app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Hide secret from the response
      const { organizerSecret, ...sessionData } = session;
      return res.status(200).json(sessionData);
    } catch (error) {
      console.error('Error getting session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Validate organizer access
  app.post('/api/sessions/:sessionId/validate-organizer', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { organizerSecret } = req.body;
      
      console.log('Validating organizer for session:', sessionId);
      console.log('Secret received:', organizerSecret ? 'Secret provided' : 'No secret provided');
      
      if (!organizerSecret) {
        return res.status(400).json({ error: 'Organizer secret is required' });
      }
      
      const isValid = await storage.validateOrganizer(sessionId, organizerSecret);
      
      console.log('Secret validation result:', isValid ? 'Valid' : 'Invalid');
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid organizer secret' });
      }
      
      return res.status(200).json({ valid: true });
    } catch (error) {
      console.error('Error validating organizer:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Edit session details (organizer only)
  app.put('/api/sessions/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const validatedData = editSessionSchema.parse({
        ...req.body,
        sessionId
      });
      
      // Validate organizer
      const isValid = await storage.validateOrganizer(sessionId, validatedData.organizerSecret);
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid organizer secret' });
      }
      
      const { organizerSecret, ...updateData } = validatedData;
      
      await storage.updateSession(sessionId, updateData);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete session (organizer only)
  app.delete('/api/sessions/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { organizerSecret } = req.body;
      
      if (!organizerSecret) {
        return res.status(400).json({ error: 'Organizer secret is required' });
      }
      
      // Validate organizer
      const isValid = await storage.validateOrganizer(sessionId, organizerSecret);
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid organizer secret' });
      }
      
      await storage.deleteSession(sessionId);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add participant to session
  app.post('/api/sessions/:sessionId/participants', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { name, contribution } = req.body;
      
      // Validate data
      const validatedData = participantContributionSchema.parse({
        sessionId,
        name,
        contribution
      });
      
      // Check if session exists
      const session = await storage.getSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Check if session is already complete
      if (session.isComplete) {
        return res.status(400).json({ error: 'This session is already complete' });
      }
      
      // Check if participant already exists
      const exists = await storage.participantExists(sessionId, name);
      
      if (exists) {
        return res.status(400).json({ error: 'A participant with this name already exists in this session' });
      }
      
      // Add participant
      const participant = await storage.addParticipant({
        sessionId,
        name,
        contribution,
        isOrganizer: false,
        refundAmount: 0
      });
      
      return res.status(201).json(participant);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding participant:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove participant (organizer only)
  app.delete('/api/sessions/:sessionId/participants/:participantId', async (req, res) => {
    try {
      const { sessionId, participantId } = req.params;
      const { organizerSecret } = req.body;
      
      // Validate data
      const validatedData = removeParticipantSchema.parse({
        sessionId,
        organizerSecret,
        participantId: parseInt(participantId)
      });
      
      // Validate organizer
      const isValid = await storage.validateOrganizer(sessionId, organizerSecret);
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid organizer secret' });
      }
      
      // Remove participant
      const participant = await storage.removeParticipant(validatedData.participantId);
      
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error removing participant:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Check if participant exists
  app.get('/api/sessions/:sessionId/participants/check/:name', async (req, res) => {
    try {
      const { sessionId, name } = req.params;
      
      const exists = await storage.participantExists(sessionId, name);
      
      return res.status(200).json({ exists });
    } catch (error) {
      console.error('Error checking participant:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
