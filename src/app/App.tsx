import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
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
    const [maxColors, setMaxColors] = useState(4);

    const main = useCallback((quality: number) => {
        async function _main() {
            const newIcons: Array<string> = [];
            const newColors: Array<string> = [];

            const iconsKeys = Object.keys(Icons);

            for (let index = 0; index < iconsKeys.length; index++) {
                const imgSrc = (Icons as any)[iconsKeys[index]];

                const image = await uploadImage(imgSrc)
                const [r, g, b] = getColor(image, quality);
                const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;

                newColors.push(`rgba(${r}, ${g}, ${b}, .${isDark ? 4 : 6})`);
                // newColors.push(`rgb(${r}, ${g}, ${b})`);
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
        main(maxColors);
    }, [main, maxColors]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setMaxColors(Number(event.target.value));
    }, []);

    return (
        <main className="App">
            {!colors.length && <section className="App-loading">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>Loading...</p>
            </section>}
            {colors.length && <header className="App-header">
                <span>Кол-во цветов в паитре: </span>
                <input
                    className="App-radio"
                    type="radio" value="2"
                    name="colors"
                    checked={maxColors === 2}
                    onChange={onChange}/>
                <input
                    className="App-radio"
                    type="radio"
                    value="4"
                    name="colors"
                    checked={maxColors === 4}
                    onChange={onChange}/>
            </header>}
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
