// @ts-ignore
// import quantize from 'quantize';
import * as Icons from './icons';

const ALLOWABLE_COLOR_BOT_LINE = 30;
const ALLOWABLE_COLOR_TOP_LINE = 170;
const MAX_RGB_DIFF = 15;

interface RGBColor {
    r: number,
    g: number,
    b: number,
}

interface RGBAColor extends RGBColor {
    a: number
}

const rgba2rgb = ({ r, g, b, a: alpha }: RGBAColor): RGBColor => ({
    r: Math.round((1 - alpha) * 255 + alpha * r),
    g: Math.round((1 - alpha) * 255 + alpha * g),
    b: Math.round((1 - alpha) * 255 + alpha * b)
});

export function isAllowedColor({ r, g, b }: RGBColor): boolean {
    const firstDiff = Math.abs(r - g) < MAX_RGB_DIFF;
    const secondDiff = Math.abs(g - b) < MAX_RGB_DIFF;
    const thirdDiff = Math.abs(r - b) < MAX_RGB_DIFF;

    return !(firstDiff && secondDiff && thirdDiff && ((r < ALLOWABLE_COLOR_BOT_LINE) || (r > ALLOWABLE_COLOR_TOP_LINE)));
}

// function createPixelArray(imgData: Uint8ClampedArray): Array<Array<number>> {
//     const pixels = imgData;
//     const pixelCount = imgData.length;
//     const pixelArray = [];
//
//     for (let i = 0; i < pixelCount; i += 4) {
//         const r = pixels[i];
//         const g = pixels[i + 1];
//         const b = pixels[i + 2];
//         // const a = pixels[i + 3];
//
//         // const rgb = rgba2rgb({ r, g, b, a });
//
//         if (isAllowedColor({ r, g, b })) {
//             pixelArray.push([r, g, b]);
//         }
//     }
//
//     return pixelArray;
// }
//
// function getColor(sourceImage: HTMLImageElement, quality: number = 4): [number, number, number] {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
//
//     canvas.width = sourceImage.naturalWidth < 48 ? sourceImage.naturalWidth : 48;
//     canvas.height = sourceImage.naturalHeight < 48 ? sourceImage.naturalHeight : 48;
//     ctx.imageSmoothingEnabled = false
//
//     ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
//
//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//
//     const pixelArray = createPixelArray(imageData.data);
//
//     const cmap = quantize(pixelArray, quality);
//
//     return cmap.palette()[0];
// }

interface HSLColor {
    h: number;
    s: number;
    l: number;
}

export function RGBToHSL({ r, g, b }: RGBColor): HSLColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const xMax = Math.max(r, g, b);
    const xMin = Math.min(r, g, b);

    const c = xMax - xMin;
    const l = (xMax + xMin) / 2;

    let h = c === 0 ? 0 : (
        xMax === r ? (g - b) / c : (
            xMax === g ? 2 + ((b - r) / c) : (
                xMax === b ? 4 + ((r - g) / c) : 0
            )
        )
    );

    h = Math.round(h * 60);
    h = h < 0 ? h + 360 : h;

    let s = 0;
    if (l > 0 && l < 1) {
        s = (xMax - l) / Math.min(l, 1 - l);
    }

    return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

const uploadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';
    img.onload = (): void => resolve(img);
    img.onerror = reject;
    img.src = src;
});

export const ICONS = Object.values(Icons);

export async function getColors(quality: number): Promise<Array<{ color: string, isLight: boolean }>> {
    const colors: Array<{ color: string, isLight: boolean }> = [];

    for (let index = 0; index < ICONS.length; index++) {
        const imgSrc = ICONS[index];

        const image = await uploadImage(imgSrc);
        let [r, g, b] = getColor2(image, quality);
        let { r: red, g: green, b: blue } = rgba2rgb({ r, g, b, a: 0.35 });
        const isLight = (r * 299 + g * 587 + b  * 114) / 1000 > 255 * 0.6;

        let { h, s, l } = RGBToHSL({ r: red, g: green, b: blue });

        if (isLight) {
            s *= 0.84;
            l *= 0.89;
        }

        colors.push({
            color: `hsl(${h}, ${s}%, ${l}%)`,
            isLight,
        });
    }

    return colors;
}

function getColor2(sourceImage: HTMLImageElement, quality: number = 2): [number, number, number] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = sourceImage.naturalWidth < 48 ? sourceImage.naturalWidth : 48;
    canvas.height = sourceImage.naturalHeight < 48 ? sourceImage.naturalHeight : 48;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const colors: Record<string, [number, number, number]> = {};
    const colors2Count: Record<string, number> = {};

    for (let index = 0; index < imageData.data.length; index += 4) {
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];

        if (isAllowedColor({ r, g, b })) {
            const key = [r, g, b].toString();
            colors[key] = [r, g, b];
            colors2Count[key] = (colors2Count[key] || 0) + 1;
        }
    }

    const [color] = Object.keys(colors2Count)
        .sort((a, b) => colors2Count[b] - colors2Count[a]);

    return colors[color];
}
