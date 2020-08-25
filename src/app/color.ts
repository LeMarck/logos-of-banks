// @ts-ignore
import quantize from 'quantize';

const ALLOWABLE_COLOR_BOT_LINE = 30;
const ALLOWABLE_COLOR_TOP_LINE = 170;
const MAX_RGB_DIFF = 15;

export interface RGBColor {
    r: number,
    g: number,
    b: number,
}

export interface RGBAColor extends RGBColor {
    a: number
}

export const rgba2rgb = ({ r, g, b, a: alpha }: RGBAColor): RGBColor => ({
    r: (1 - alpha / 255) * 255 + (alpha / 255) * r,
    g: (1 - alpha / 255) * 255 + (alpha / 255) * g,
    b: (1 - alpha / 255) * 255 + (alpha / 255) * b
});

export function isAllowedColor({ r, g, b }: RGBColor): boolean {
    const firstDiff = Math.abs(r - g) < MAX_RGB_DIFF;
    const secondDiff = Math.abs(g - b) < MAX_RGB_DIFF;
    const thirdDiff = Math.abs(r - b) < MAX_RGB_DIFF;

    return !(firstDiff && secondDiff && thirdDiff && ((r < ALLOWABLE_COLOR_BOT_LINE) || (r > ALLOWABLE_COLOR_TOP_LINE)));
}

export function createPixelArray(imgData: Uint8ClampedArray, pixelCount: number, quality: number): Array<Array<number>> {
    const pixels = imgData;
    const pixelArray = [];

    for (let i = 0; i < pixelCount; i += quality) {
        const offset = i * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const a = pixels[offset + 3];

        const rgb = rgba2rgb({ r, g, b, a });

        if (isAllowedColor(rgb)) {
            pixelArray.push([r, g, b]);
        }
    }

    return pixelArray;
}

export function getColor(sourceImage: HTMLImageElement, quality: number = 10): [number, number, number] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width  = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;

    ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height);

    const imageData = ctx.getImageData(0, 0, sourceImage.naturalWidth, sourceImage.naturalHeight);
    const pixelCount = sourceImage.naturalWidth * sourceImage.naturalHeight;

    const pixelArray = createPixelArray(imageData.data, pixelCount, quality);

    const cmap = quantize(pixelArray, 5);

    return cmap.palette()[0];
}
