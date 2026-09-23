export function exportRevisionToPdf(title) {
  // Trigger standard formatted browser print / Save as PDF
  const prevTitle = document.title;
  if (title) {
    document.title = `${title} - Revision Notes`;
  }
  window.print();
  document.title = prevTitle;
}
