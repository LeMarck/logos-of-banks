import {useEffect, useState} from 'react';

const CONTENT_TYPE = 'image/svg+xml';

const loadingSVG = (src: string): Promise<string> => fetch(src)
    .then((response: Response) => {
        const contentType = response.headers.get('Content-Type') || '';

        if (response.status === 200 && contentType.indexOf(CONTENT_TYPE) !== -1) {
            return response.text();
        }

        return Promise.reject(new Error('This not SVG'));
    })
    .then((svg: string) => `data:${CONTENT_TYPE},${encodeURIComponent(svg)}`);

interface CanvasData {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

function drawImage(image: HTMLImageElement, width?: number, height?: number): CanvasData {
    width = width || image.naturalWidth;
    height = height || image.naturalHeight;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {canvas, ctx};
}

function getImageSrc(image: HTMLImageElement): string {
    const {canvas} = drawImage(image);

    return canvas.toDataURL();
}

interface ImageInfo {
    image: HTMLImageElement;
    src: string;
}

function loadingImage(src: string): Promise<ImageInfo> {
    const isSvg = /\.svg$/gim.test(src);

    return (isSvg ? loadingSVG(src) : Promise.resolve(src))
        .then(imgSrc => new Promise<ImageInfo>((resolve, reject) => {
            const img = new Image();

            img.crossOrigin = 'anonymous';
            img.onload = (): void => resolve({image: img, src: isSvg ? imgSrc : getImageSrc(img)})
            img.onerror = reject;
            img.src = imgSrc;
        }));
}

interface RGB {
    red: number,
    green: number,
    blue: number,
}

const ALLOWABLE_COLOR_BOT_LINE = 30;
const ALLOWABLE_COLOR_TOP_LINE = 170;
const MAX_RGB_DIFF = 15;

function isAllowedColor({red, green, blue}: RGB): boolean {
    const firstDiff = Math.abs(red - green) < MAX_RGB_DIFF;
    const secondDiff = Math.abs(green - blue) < MAX_RGB_DIFF;
    const thirdDiff = Math.abs(red - blue) < MAX_RGB_DIFF;

    return !(
        firstDiff && secondDiff && thirdDiff &&
        ((red < ALLOWABLE_COLOR_BOT_LINE) || (red > ALLOWABLE_COLOR_TOP_LINE))
    );
}

interface RGBA extends RGB {
    alpha: number
}

const rgba2rgb = ({red, green, blue, alpha}: RGBA): RGB => ({
    red: Math.round((1 - alpha) * 255 + alpha * red),
    green: Math.round((1 - alpha) * 255 + alpha * green),
    blue: Math.round((1 - alpha) * 255 + alpha * blue)
});

interface HSL {
    hue: number;
    saturation: number;
    lightness: number;
}

function rgb2hsl({red, green, blue}: RGB): HSL {
    red /= 255;
    green /= 255;
    blue /= 255;

    const xMax = Math.max(red, green, blue);
    const xMin = Math.min(red, green, blue);

    const c = xMax - xMin;
    const lightness = (xMax + xMin) / 2;

    let hue = c === 0 ? 0 : (
        xMax === red ? (green - blue) / c : (
            xMax === green ? 2 + ((blue - red) / c) : (
                xMax === blue ? 4 + ((red - green) / c) : 0
            )
        )
    );

    hue = Math.round(hue * 60);
    hue = hue < 0 ? hue + 360 : hue;

    let saturation = 0;
    if (lightness > 0 && lightness < 1) {
        saturation = (xMax - lightness) / Math.min(lightness, 1 - lightness);
    }

    return {hue, saturation: Math.round(saturation * 100), lightness: Math.round(lightness * 100)};
}

const scaleSize = (size: number) => size < 48 ? size : 48;

const color2key = (color: RGB): string => Object.values(color).join(':');

function key2color(key: string): RGB {
    const [red, green, blue] = key.split(':').map(Number);

    return {red, green, blue};
}

function getColorsHisto(imageData: ImageData): Record<string, number> {
    const colors: Record<string, number> = {};

    for (let index = 0; index < imageData.data.length; index += 4) {
        const rgb: RGB = {
            red: imageData.data[index],
            green: imageData.data[index + 1],
            blue: imageData.data[index + 2]
        }

        if (isAllowedColor(rgb)) {
            const key = color2key(rgb);
            colors[key] = (colors[key] || 0) + 1;
        }
    }

    return colors;
}

const isLight = ({red, green, blue}: RGB) => (red * 299 + green * 587 + blue * 114) / 1000 > 255 * 0.6;

const getDominantColor = (colorsHisto: Record<string, number>): RGB =>
    key2color(Object.keys(colorsHisto).sort((a, b) => colorsHisto[b] - colorsHisto[a])[0]);

interface ILogoInfo {
    src: string;
    color: string;
}

function getColor({image, src}: ImageInfo): ILogoInfo {
    const {canvas, ctx} = drawImage(image, scaleSize(image.naturalWidth), scaleSize(image.naturalHeight));
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = getColorsHisto(imageData);
    const {red, green, blue} = getDominantColor(colors);
    const rgb = rgba2rgb({red, green, blue, alpha: 0.35});
    let {hue, saturation, lightness} = rgb2hsl(rgb);

    if (isLight({red, green, blue})) {
        saturation *= 0.84;
        lightness *= 0.89;
    }

    return {color: `hsl(${hue}, ${saturation}%, ${lightness}%)`, src}
}

export function useLogo(src: string) {
    const [logoInfo, setLogoInfo] = useState<ILogoInfo | undefined>();

    useEffect(() => {
        loadingImage(src).then(getColor).then(setLogoInfo);
    }, [src]);

    return logoInfo;
}
