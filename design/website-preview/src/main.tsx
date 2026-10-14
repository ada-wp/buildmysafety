import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/site.css';
import Velorah from './components/velorah/velorah';
import AboutPage from './pages/about';
import { aboutContent } from './content/aboutContent';

const isAbout = ['/about', '/about.html', '/about/index.html'].includes(window.location.pathname.replace(/\/+$/, ''));
if (isAbout) {
  document.title = aboutContent.meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', aboutContent.meta.description);
}
const root = document.getElementById('root')!;
const app = <React.StrictMode>{isAbout ? <AboutPage /> : <Velorah />}</React.StrictMode>;
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
