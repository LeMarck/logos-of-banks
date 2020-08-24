import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './logo.svg';
import * as Icons from './iconsExport';

const ALLOWABLE_COLOR_BOT_LINE = 30;
const ALLOWABLE_COLOR_TOP_LINE = 170;
const MAX_RGB_DIFF = 15;

interface RGBColor {
    r: number,
    g: number,
    b: number,
}

function isAllowedColor({ r, g, b }: RGBColor): boolean {
    const firstDiff = Math.abs(r - g) < MAX_RGB_DIFF;
    const secondDiff = Math.abs(g - b) < MAX_RGB_DIFF;
    const thirdDiff = Math.abs(r - b) < MAX_RGB_DIFF;

    return !(firstDiff && secondDiff && thirdDiff && ((r < ALLOWABLE_COLOR_BOT_LINE) || (r > ALLOWABLE_COLOR_TOP_LINE)));
}


interface RGBAColor extends RGBColor {
    a: number
}

function rgba2rgb({ r, g, b, a: alpha }: RGBAColor): RGBColor {
    return {
        r: (1 - alpha / 255) * 255 + (alpha / 255) * r,
        g: (1 - alpha / 255) * 255 + (alpha / 255) * g,
        b: (1 - alpha / 255) * 255 + (alpha / 255) * b
    };
}

const getColor = (imgSrc: string): Promise<string> => new Promise<string>((resolve, reject) => {
    const loader = new Image();
    loader.crossOrigin = 'anonymous';
    loader.onload = (): void => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = loader.width;
        canvas.height = loader.height;

        ctx.drawImage(loader, 0, 0, loader.width, loader.width);

        const { data: imageData } = ctx.getImageData(0, 0, loader.width, loader.width);
        let size = 0;
        const data = [0, 0, 0];

        for (let i = 0, len = imageData.length; i < len; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            const rgb = rgba2rgb({ r, g, b, a });

            if (isAllowedColor(rgb)) {
                data[0] += rgb.r;
                data[1] += rgb.g;
                data[2] += rgb.b;
                size++;
            }
        }

        resolve(`rgba(${~~(data[0] / size)}, ${~~(data[1] / size)}, ${~~(data[2] / size)}, .4)`);
    };
    loader.onerror = reject;
    loader.src = imgSrc;
});

function App() {
    const [icons, setIcons] = useState<Array<string>>([]);
    const [colors, setColors] = useState<Array<string>>([]);

    useEffect(() => {

        async function main() {
            const newIcons: Array<string> = [];
            const newColors: Array<string> = [];

            const iconsKeys = Object.keys(Icons);

            for (let index = 0; index < iconsKeys.length; index++) {
                const imgSrc = (Icons as any)[iconsKeys[index]];
                const color = await getColor(imgSrc);

                newColors.push(color);
                newIcons.push(imgSrc);
            }

            setIcons(newIcons);
            setColors(newColors);
        }

        main();
    }, []);

    return (
        <section className="App">
            {!colors.length && <section className="App-loading">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>Loading...</p>
            </section>}
            {colors.map((color, i) =>
                <div key={i} className={'App-round'}>
                    <div className={'App-bg'} style={{ background: color }}/>
                    <img src={icons[i]} className={'App-icon'} alt={''}/>
                </div>
            )}
        </section>
    );
}

export default App;
