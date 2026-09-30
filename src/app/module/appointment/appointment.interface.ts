export interface IBookAppointmentPayload {
  doctorId: string;
  scheduleId: string;
}

export interface IUpdateBookAppointmentPayload {
  doctorId?: string;
  scheduleId?: string;
  status?: string;
}
