/**
 * Strips markdown formatting from text
 * @param {string} text - The text with markdown formatting
 * @returns {string} - The text without markdown formatting
 */
export const stripMarkdown = (text) => {
  if (!text) return '';
  
  // Replace bold/italic markdown
  let result = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold **text**
  result = result.replace(/\*(.*?)\*/g, '$1');       // Italic *text*
  result = result.replace(/__(.*?)__/g, '$1');       // Bold __text__
  result = result.replace(/_(.*?)_/g, '$1');         // Italic _text_
  
  // Replace headers
  result = result.replace(/#{1,6}\s+/g, '');
  
  // Replace bullet points
  result = result.replace(/^\s*[-*+]\s+/gm, '• ');
  
  // Replace numbered lists
  result = result.replace(/^\s*\d+\.\s+/gm, '');
  
  // Replace code blocks
  result = result.replace(/```[\s\S]*?```/g, '');
  result = result.replace(/`([^`]+)`/g, '$1');
  
  // Replace blockquotes
  result = result.replace(/^\s*>\s+/gm, '');
  
  // Replace horizontal rules
  result = result.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  
  return result;
};

/**
 * Copies text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - Whether the copy was successful
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
