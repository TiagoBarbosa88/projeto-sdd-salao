const HEADER_OFFSET_PX = 88;

export function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (!element) {
    return;
  }

  const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  });
}
