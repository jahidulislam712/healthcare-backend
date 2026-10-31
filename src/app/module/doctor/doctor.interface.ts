import z from "zod";
import { doctorUpdateZodSchema } from "./doctor.validation";

export type IUpdateDoctorPayload = z.infer<typeof doctorUpdateZodSchema>;
