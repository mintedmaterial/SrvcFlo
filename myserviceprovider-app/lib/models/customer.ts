import { ObjectId } from 'mongodb';

export interface Customer {
  _id: ObjectId;
  providerId: ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  projects: {
    description: string;
    files?: string[];
  }[];
}
