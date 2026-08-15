/** Campos públicos de um usuário — nunca inclua passwordHash em respostas da API. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  globalRole: true,
} as const;
