const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.82;

export async function readImageAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.');
  }

  const dataUrl = await loadFileAsDataUrl(file);
  return compressDataUrl(dataUrl, file.type);
}

function loadFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Nao foi possivel processar a imagem.'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      const outputType = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outputType, JPEG_QUALITY));
    };
    image.onerror = () => reject(new Error('Imagem invalida.'));
    image.src = dataUrl;
  });
}
