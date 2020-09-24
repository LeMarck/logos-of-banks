import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { getColors, ICONS } from './color';

const Loading = () => <section className="App-loading">
    <img src={logo} className="App-logo" alt="logo"/>
    <p>Loading...</p>
</section>;

const Colors = ({ time, colors }: { time: number, colors: Array<{ color: string, isLight: boolean }> }) => <>
    <p>Обработка <b>{ICONS.length}</b> иконок заняла <b>{time}</b>мс</p>
    <section className="App-logos">
        {colors.map((color, i) =>
            <div key={i} className={'App-round'}>
                <div className={'App-bg'} style={{ background: color.color, border: color.isLight ? '1px solid black' : '1px solid white' }}>
                    <svg width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd"
                              d="M9.17 7h-.92C7.548 7 7 7.559 7 8.222v15.556C7 24.44 7.548 25 8.25 25h13.5c.702 0 1.25-.559 1.25-1.222V8.222C23 7.56 22.452 7 21.75 7h-.92A3.001 3.001 0 0118 9h-6a3.001 3.001 0 01-2.83-2zm11.66-2h.92C23.533 5 25 6.431 25 8.222v15.556C25 25.569 23.533 27 21.75 27H8.25C6.467 27 5 25.569 5 23.778V8.222C5 6.431 6.467 5 8.25 5h.92A3.001 3.001 0 0112 3h6c1.306 0 2.418.835 2.83 2zM11 6a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm0 7a1 1 0 100 2h8a1 1 0 100-2h-8zm-1 6a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z"
                              fill="#fff"/>
                    </svg>
                </div>
                <img src={ICONS[i]} className={'App-icon'} alt={''}/>
            </div>
        )}
    </section>
</>;

export function App(): JSX.Element {
    const [colors, setColors] = useState<Array<{ color: string, isLight: boolean }>>([]);
    const [time, setTime] = useState(0);

    useEffect(() => {
        setColors([]);
        const startTime = Date.now();
        getColors(4).then(setColors).then(() => setTime(Date.now() - startTime));
    }, []);

    return (
        <main className="App">
            {!colors.length && <Loading/>}
            {colors.length && <Colors time={time} colors={colors}/>}
        </main>
    );
}
