export const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

export async function isAvailableAsync() {
  return false;
}

export function useKeepAwake() {
  // Passenger does not need keep-awake; Expo dev tools can safely no-op here.
}

export async function activateKeepAwake() {
  return undefined;
}

export async function activateKeepAwakeAsync() {
  return undefined;
}

export async function deactivateKeepAwake() {
  return undefined;
}

export function addListener() {
  return {
    remove() {},
  };
}
