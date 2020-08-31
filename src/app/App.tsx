import React, { useCallback, useEffect, useState } from 'react';
import logo from './logo.svg';
import { getColor } from './color';
import * as Icons from './icons';
import './App.css';

const uploadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = (): void => resolve(img);
    img.onerror = reject;
    img.src = src;
});

export function App(): JSX.Element {
    const [icons, setIcons] = useState<Array<string>>([]);
    const [colors, setColors] = useState<Array<string>>([]);

    const main = useCallback((quality: number) => {
        async function _main() {
            const newIcons: Array<string> = [];
            const newColors: Array<string> = [];

            const iconsKeys = Object.keys(Icons);

            for (let index = 0; index < iconsKeys.length; index++) {
                const imgSrc = (Icons as any)[iconsKeys[index]];

                const image = await uploadImage(imgSrc)
                let [r, g, b] = getColor(image, quality);
                const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
                if (!isDark) {
                    r *= 0.95;
                    g *= 0.95;
                    b *= 0.95;
                }

                newColors.push(`rgba(${r}, ${g}, ${b}, .${isDark ? 4 : 6})`);
                newIcons.push(imgSrc);
            }

            setIcons(newIcons);
            setColors(newColors);
        }

        setIcons([]);
        setColors([]);
        _main();
    }, []);

    useEffect(() => {
        main(4);
    }, [main]);

    return (
        <main className="App">
            {!colors.length && <section className="App-loading">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>Loading...</p>
            </section>}
            <section className="App-logos">
                {colors.map((color, i) =>
                    <div key={i} className={'App-round'}>
                        <div className={'App-bg'} style={{ background: color }}/>
                        <img src={icons[i]} className={'App-icon'} alt={''}/>
                    </div>
                )}
            </section>
        </main>
    );
}
