// @ts-ignore
import quantize from 'quantize';
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

// const rgba2rgb = ({ r, g, b, a: alpha }: RGBAColor): RGBColor => ({
//     r: (1 - alpha / 255) * 255 + (alpha / 255) * r,
//     g: (1 - alpha / 255) * 255 + (alpha / 255) * g,
//     b: (1 - alpha / 255) * 255 + (alpha / 255) * b
// });

function isAllowedColor({ r, g, b }: RGBColor): boolean {
    const firstDiff = Math.abs(r - g) < MAX_RGB_DIFF;
    const secondDiff = Math.abs(g - b) < MAX_RGB_DIFF;
    const thirdDiff = Math.abs(r - b) < MAX_RGB_DIFF;

    return !(firstDiff && secondDiff && thirdDiff && ((r < ALLOWABLE_COLOR_BOT_LINE) || (r > ALLOWABLE_COLOR_TOP_LINE)));
}

function createPixelArray(imgData: Uint8ClampedArray): Array<Array<number>> {
    const pixels = imgData;
    const pixelCount = imgData.length;
    const pixelArray = [];

    for (let i = 0; i < pixelCount; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // const a = pixels[i + 3];

        // const rgb = rgba2rgb({ r, g, b, a });

        if (isAllowedColor({ r, g, b })) {
            pixelArray.push([r, g, b]);
        }
    }

    return pixelArray;
}

function getColor(sourceImage: HTMLImageElement, quality: number = 4): [number, number, number] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width  = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;

    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const pixelArray = createPixelArray(imageData.data);

    const cmap = quantize(pixelArray, quality);

    return cmap.palette()[0];
}

interface HSLColor {
    h: number;
    s: number;
    l: number;
}

function RGBToHSL({ r, g, b }: RGBColor): HSLColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;

    let h = delta === 0 ? 0 : (cmax === r ? ((g - b) / delta) % 6 : (cmax === g ? (b - r) / delta + 2 : (r - g) / delta + 4))
    h = Math.round(h * 60);

    if (h < 0) h += 360;

    let l = (cmax + cmin) / 2;

    let s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

const uploadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';
    img.onload = (): void => resolve(img);
    img.onerror = reject;
    img.src = src;
});

export const ICONS = Object.values(Icons);

export async function getColors(quality: number): Promise<Array<string>> {
    const colors: Array<string> = [];

    for (let index = 0; index < ICONS.length; index++) {
        const imgSrc = ICONS[index];

        const image = await uploadImage(imgSrc)
        let [r, g, b] = getColor(image, quality);
        const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
        if (!isDark) {
            r *= 0.95;
            g *= 0.95;
            b *= 0.95;
        }

        let { h, s, l } = RGBToHSL({ r, g, b });

        if (!isDark) {
            s += 10;
        }

        colors.push(`hsla(${h}, ${s}%, ${l}%, .${isDark ? 4 : 6})`);
    }

    return colors;
}
