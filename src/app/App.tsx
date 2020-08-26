import React, { useEffect, useState } from 'react';
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

    useEffect(() => {

        async function main() {
            const newIcons: Array<string> = [];
            const newColors: Array<string> = [];

            const iconsKeys = Object.keys(Icons);

            for (let index = 0; index < iconsKeys.length; index++) {
                const imgSrc = (Icons as any)[iconsKeys[index]];

                const image = await uploadImage(imgSrc)
                const [r, g, b] = getColor(image);
                const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;

                newColors.push(`rgba(${r}, ${g}, ${b}, .${isDark ? 4 : 6})`);
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
