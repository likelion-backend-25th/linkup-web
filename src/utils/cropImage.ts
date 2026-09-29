export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    image.src = src;
  });
}

export async function cropImage(
  sourceUrl: string,
  area: CropArea,
  fileName: string,
): Promise<File> {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('사진 편집을 시작하지 못했습니다.');
  }

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('편집한 사진을 만들지 못했습니다.'));
        }
      },
      'image/jpeg',
      0.92,
    );
  });

  const baseName = fileName.replace(/\.[^.]+$/, '') || 'post-image';
  return new File([blob], `${baseName}-edited.jpg`, { type: 'image/jpeg' });
}
