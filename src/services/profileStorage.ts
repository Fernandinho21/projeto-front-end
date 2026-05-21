import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const profileKey = (userId: string) => `biblioteca:profile:${userId}`;

export const loadUserProfile = async (
  userId: string,
  fallbackName: string
): Promise<UserProfile> => {
  try {
    const storedProfile = await AsyncStorage.getItem(profileKey(userId));

    if (!storedProfile) {
      return { nickname: fallbackName };
    }

    return { nickname: fallbackName, ...JSON.parse(storedProfile) };
  } catch {
    return { nickname: fallbackName };
  }
};

export const saveUserProfile = async (
  userId: string,
  profile: UserProfile
) => {
  await AsyncStorage.setItem(profileKey(userId), JSON.stringify(profile));
};
