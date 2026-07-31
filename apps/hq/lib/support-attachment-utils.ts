export function isImageAttachment(file: {
  fileType: string;
  fileName: string;
}): boolean {
  if (file.fileType.startsWith('image/')) return true;
  return /\.(webp|png|jpe?g|gif|svg)$/i.test(file.fileName);
}

export function isPdfAttachment(file: {
  fileType: string;
  fileName: string;
}): boolean {
  if (file.fileType === 'application/pdf') return true;
  return /\.pdf$/i.test(file.fileName);
}
