import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력하세요.')
    .email('올바른 이메일을 입력하세요.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
