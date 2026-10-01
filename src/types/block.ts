/** GET /api/v1/member/blocks 항목 (BlockedMemberResponseDto) */
export interface BlockedMember {
  memberId: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
}
