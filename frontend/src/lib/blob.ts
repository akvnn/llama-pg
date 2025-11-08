export function getContentType(fileExtension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    json: "application/json",
    xml: "application/xml",
  };
  return mimeTypes[fileExtension.toLowerCase()] || "application/octet-stream";
}

export function base64ToBlob(
  base64: string,
  fileExtension: string = ""
): string {
  const byteCharacters = atob(base64);

  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const contentType = getContentType(fileExtension);
  const blob = new Blob([byteNumbers], { type: contentType });
  return URL.createObjectURL(blob);
}
