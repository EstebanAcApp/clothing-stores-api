import { SetMetadata } from "@nestjs/common";

export const IS_STAFF_KEY = 'isStaff';
export const Staff = () => SetMetadata(IS_STAFF_KEY, true);