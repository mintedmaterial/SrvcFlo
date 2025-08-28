import { ObjectId } from 'mongodb';

export interface Provider {
  _id: ObjectId;
  name: string;
  email: string;
  services: ObjectId[];
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  chatbotConfig: {
    welcomeMessage?: string;
    faq: {
      question: string;
      answer: string;
    }[];
  };
}
