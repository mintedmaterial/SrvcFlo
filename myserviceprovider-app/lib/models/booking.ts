import { ObjectId } from 'mongodb';

export interface Booking {
  _id: ObjectId;
  providerId: ObjectId;
  customerId: ObjectId;
  serviceId: ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}
