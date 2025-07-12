import { z } from "zod";

export const healthDataSchema = z.object({
  height: z.coerce.number().positive({ message: "Height must be a positive number." }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }),
  age: z.coerce.number().positive().int({ message: "Age must be a positive whole number." }),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, { message: "Use format like 120/80." }),
  cholesterol: z.coerce.number().positive({ message: "Cholesterol must be a positive number." }),
  sugarLevels: z.coerce.number().positive({ message: "Sugar levels must be a positive number." }),
  fats: z.coerce.number().min(0, { message: "Fats cannot be negative." }).max(100, { message: "Fats cannot exceed 100%." }),
  bloodPoints: z.coerce.number().positive({ message: "Blood Points must be a positive number." }),
  bmi: z.coerce.number().positive({ message: "BMI must be a positive number." }),
});

export type HealthDataEntry = z.infer<typeof healthDataSchema>;

export type HealthData = HealthDataEntry & {
  id: string;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
};
