import { Session, Participant } from "@shared/schema";

export interface SessionWithParticipants extends Session {
  participants: Participant[];
}

export interface CreateSessionFormData {
  organizerName: string;
  giftName: string;
  giftLink: string;
  giftPrice: number;
  organizerContribution: number;
  expectedParticipants: number;
  organizerSecret: string;
}

export interface JoinSessionFormData {
  sessionId: string;
  name: string;
  isOrganizer: boolean;
  organizerSecret?: string;
}

export interface ContributionFormData {
  contribution: number;
}

export interface EditGiftFormData {
  giftName: string;
  giftLink: string;
  giftPrice: number;
  organizerContribution: number;
}

export interface LoginFormData {
  organizerSecret: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}

export interface SessionCreationResponse {
  sessionId: string;
}
