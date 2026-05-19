import ReactDOM from 'react-dom/client';

import App from './App';

import './index.css';

async function bootstrap() {

    // clear Electron storage
    await window.electronAPI
        ?.authClearToken();

    ReactDOM.createRoot(
        document.getElementById('root')!,
    ).render(
        <App />,
    );
}

bootstrap().catch(console.error);
