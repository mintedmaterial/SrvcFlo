import { ObjectId } from 'mongodb';

export interface Service {
  _id: ObjectId;
  providerId: ObjectId;
  name: string;
  description: string;
  pricing: {
    materialCost: number;
    laborCost: number;
    markup: number;
  };
}
