/** Wait for fonts so text metrics are identical on every frame. */
export async function loadFonts(): Promise<void> {
  await document.fonts.ready;
}
