import * as core from './script.js';

const appRoot = document.getElementById('app');

const routes = {
    home: {
        html: './pages/home/home.html',
        css: './pages/home/home.css',
        js: './pages/home/home.js'
    },
    game: {
        html: './pages/game/game.html',
        css: './pages/game/game.css',
        js: './pages/game/game.js'
    },
    result: {
        html: './pages/result/result.html',
        css: './pages/result/result.css',
        js: './pages/result/result.js'
    }
};

let activeRoute = null;
let skipNextHashEvent = false;

function getRouteFromHash() {
    const value = window.location.hash.replace('#', '').trim();
    return routes[value] ? value : 'home';
}

function mountPageStyles(href) {
    let styleLink = document.getElementById('page-style');
    if (!styleLink) {
        styleLink = document.createElement('link');
        styleLink.id = 'page-style';
        styleLink.rel = 'stylesheet';
        document.head.appendChild(styleLink);
    }
    styleLink.href = href;
}

async function renderRoute(routeName) {
    const route = routes[routeName] || routes.home;
    activeRoute = routeName;

    mountPageStyles(route.css);

    try {
        const [html, pageModule] = await Promise.all([
            fetch(route.html).then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${route.html}`);
                }
                return response.text();
            }),
            import(route.js)
        ]);

        appRoot.innerHTML = html;

        if (typeof pageModule.init === 'function') {
            pageModule.init({
                navigate,
                core,
                activeRoute
            });
        }
    } catch (error) {
        appRoot.innerHTML = `
            <section class="loading card-3d" role="alert">
                <h1>Page Load Error</h1>
                <p>Something went wrong while loading this section. Please refresh and try again.</p>
            </section>
        `;
    }
}

async function navigate(routeName) {
    const safeRoute = routes[routeName] ? routeName : 'home';

    if (window.location.hash !== `#${safeRoute}`) {
        skipNextHashEvent = true;
        window.location.hash = safeRoute;
    }

    await renderRoute(safeRoute);
}

window.addEventListener('hashchange', () => {
    if (skipNextHashEvent) {
        skipNextHashEvent = false;
        return;
    }

    const routeName = getRouteFromHash();
    if (routeName !== activeRoute) {
        renderRoute(routeName);
    }
});

renderRoute(getRouteFromHash());
