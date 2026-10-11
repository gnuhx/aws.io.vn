/** Only same-site paths are followed after sign-in, so ?redirect= can't send users to another site. */
export function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}
