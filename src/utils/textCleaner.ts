
export const cleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '')   // Remove italic markers
    .replace(/_/g, '')    // Remove underscore markers
    .replace(/`/g, '')    // Remove code markers
    .replace(/#/g, '')    // Remove heading markers
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .trim();
};
