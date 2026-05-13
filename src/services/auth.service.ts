import { releaseFileMakerToken } from '@/lib/filemaker/auth';

export const AuthService = {
  async logout(): Promise<void> {
    await releaseFileMakerToken();
  },
};
