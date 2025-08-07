import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { app } from './firebase';

const storage = getStorage(app);

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
