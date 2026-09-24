import { z } from 'zod';

export const postUpdateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '본문을 입력하세요.')
    .max(1000, '본문은 1000자까지 입력할 수 있습니다.'),
  imageUrl: z.string().trim(),
});

export type PostUpdateFormValues = z.infer<typeof postUpdateSchema>;
