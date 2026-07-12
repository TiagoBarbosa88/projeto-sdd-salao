export function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
