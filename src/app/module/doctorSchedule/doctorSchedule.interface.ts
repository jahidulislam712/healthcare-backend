export interface ICreatedoctorSchedulePayload {
  scheduleIds: string[];
}

export interface IUpdateDoctorSchedulePayload {
  scheduleIds: {
    shouldDelete: boolean;
    scheduleId: string;
  }[];
}
