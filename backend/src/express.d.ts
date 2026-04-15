declare global {
  namespace Express {
    interface Request {
      employer?: {
        userId: string;
        organizationId: string;
        role: string;
      };
    }
  }
}

export {};
