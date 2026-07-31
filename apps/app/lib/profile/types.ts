export interface MyProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  themeKey?: string | null;
  isRuknyVerified?: boolean;
}
