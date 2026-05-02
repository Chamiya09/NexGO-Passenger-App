import * as ImagePicker from 'expo-image-picker';

import { API_BASE_URL, parseApiResponse } from '@/lib/api';

type PickedProfileImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type UploadResponse = {
  fileUrl?: string;
  secureUrl?: string;
  url?: string;
};

export async function pickProfileImageFromGallery(): Promise<PickedProfileImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Gallery permission is required to select a profile image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `profile-image-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

export async function uploadProfileImage({ uri, name, mimeType }: PickedProfileImage): Promise<string> {
  const formData = new FormData();

  formData.append('file', {
    uri,
    name,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await parseApiResponse<UploadResponse>(response);
  const uploadedUrl = data.fileUrl || data.secureUrl || data.url;

  if (!uploadedUrl) {
    throw new Error('Image upload failed. No profile image URL was returned.');
  }

  return uploadedUrl;
}
