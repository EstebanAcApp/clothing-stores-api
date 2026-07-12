import { Customer, User } from "generated/prisma/client";
import { Device } from "generated/prisma/client";

export type StaffPayload = Pick<User, 'id' | 'email' | 'name' | 'role' | 'status'> & {
  deviceId: Device['id'];
  accountType: 'staff';
};

export type CustomerPayload = Pick<Customer, 'id' | 'email' | 'userName' | 'firstName' | 'lastName' | 'phone' | 'address' | 'status'> & {
  accountType: 'customer';
};

type AccountPayload = StaffPayload | CustomerPayload;

declare global {
  namespace Express {
    interface Request {
      account?: AccountPayload;
    }
  }
}