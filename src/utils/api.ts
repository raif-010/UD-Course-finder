/**
 * Utility to resolve API URLs.
 * Detects if the app is running in an APK / WebView (where relative fetches fail due to file:// or localhost origins)
 * and resolves them to the deployed cloud URL.
 */
export function getApiUrl(path: string): string {
  const origin = window.location.origin;

  // Detect APK/WebView, local files, capacitor, etc.
  const isLocalOrApk = 
    origin.startsWith('file:') || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.startsWith('app://') ||
    origin.startsWith('http://localhost') ||
    !origin.includes('.run.app'); // Live platform apps always run on *.run.app

  if (isLocalOrApk) {
    // Shared App URL for this applet
    const baseUrl = 'https://ais-pre-lbw3rh5xxlocn6vwmchkkj-1039468304397.asia-southeast1.run.app';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  return path;
}
