import { z } from 'zod';

export const profileEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력하세요.')
    .max(30, '이름은 30자까지 입력할 수 있습니다.'),
  uniqueId: z
    .string()
    .trim()
    .min(3, '아이디는 3자 이상이어야 합니다.')
    .max(30, '아이디는 30자까지 입력할 수 있습니다.')
    .regex(/^[a-zA-Z0-9._]+$/, '영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.'),
  introduction: z.string().max(200, '소개는 200자까지 입력할 수 있습니다.'),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
