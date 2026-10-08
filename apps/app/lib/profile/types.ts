export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

export interface MyProfileUser {
  email?: string | null;
  phone?: string | null;
  twoFactorEnabled?: boolean;
}

export interface MyProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  themeKey?: string | null;
  location?: string | null;
  visibility?: ProfileVisibility;
  hideEmail?: boolean;
  hidePhone?: boolean;
  hideLocation?: boolean;
  isRuknyVerified?: boolean;
  user?: MyProfileUser;
}

export interface UpdateMyProfileInput {
  username?: string;
  name?: string;
  bio?: string;
  location?: string;
  visibility?: ProfileVisibility;
  hideEmail?: boolean;
  hidePhone?: boolean;
  hideLocation?: boolean;
  themeKey?: string;
}
