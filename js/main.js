class Application {

    /**
     * Constructeur de l'application météo
     * Stocke les référence des balises HTML générés dynamiquement
     */
    constructor() {
        /** ELEMENTS HTML */
        this.searchInput = document.querySelector('#searchInput');
        this.submitButton = document.querySelector('#searchForm button[type=submit]');
        this.meteo = document.querySelector('#meteo');
        this.pageTitle = document.querySelector('#pageTitle');
        this.sidenav = document.querySelectorAll('.sidenav');
        
        /** Instance de l'accordéon de la météo et du menu */
        this.collapsible = M.Collapsible.init(this.meteo);
        this.menu = M.Sidenav.init(this.sidenav);

        /**
         * @var {boolean} requestInProgress Vaut true si une requête est déja en cours
         */
        this.requestInProgress = false;
    }

    /**
     * Effectue une requête AJAX du type GET et retourne le résultat dans une promesse
     * @param {string} url Url à appeller
     * @param {Object} params Paramètres GET à passer dans l'url
     * @return {string} Réponse de la requête HTTP sous forme de texte
     */
    async get(url, params) {
        if (params) {
            url += '?' + Object.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&');
        }

        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url);
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        resolve(request.responseText);
                    } else {
                        reject(request.status);
                    }
                }
            };
            request.send(null);
        });
    }

    async setSearch(city) {
        this.searchInput.value = city;
        this.search();
    }

    /**
     * Effectue une requête ajax pour récupéré les informations météo
     * en fonction de la ville entré dans l'input de recherche
     * Appelle ensuite les fonction fetchImage() et render() si la requête est un succès
     */
    async search() {
        if (this.requestInProgress) {
            return;
        }

        const searchRequest = this.searchInput.value;

        this.submitButton.classList.add('disabled');
        this.requestInProgress = true;

        try {
            const data = JSON.parse(await this.get('https://api.openweathermap.org/data/2.5/forecast/daily', {
                q: searchRequest.toLowerCase(),
                APPID: 'ee07e2bf337034f905cde0bdedae3db8',
                units: 'metric',
                lang: 'fr'
            }));

            this.render(data);
            this.searchInput.blur();
        } catch (error) {
            if (error === 404) {
                M.toast({ displayLength: 4000, html: 'Cette ville est introuvable 🤨' });
            } else {
                M.toast({ displayLength: 4000, html: 'Impossible d\'effectuer la requête 😬<br>Vérifiez votre connexion internet' });
            }
        } finally {
            this.submitButton.classList.remove('disabled');
            this.requestInProgress = false;
        }
    }

    /**
     * Génère le rendu HTML de la div météo en fonction des données passées en paramètre
     * 
     * @param {Array<*>} data Données météo
     */
    render(dataList) {
        console.log(dataList);

        this.pageTitle.innerText = "Météo à " + dataList.city.name + ", " + isoCountries[dataList.city.country];

        // Tableau météo
        const render = dataList.list.map((data, i) => {
            let date = new Date(data.dt * 1000);
            date = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

            return `
                <li>
                    <div class="collapsible-header">
                        <i class="wi wi-owm-${data.weather[0].id}"></i>${date} · ${data.temp.day}°C
                    </div>
                    
                    <div class="collapsible-body">
                        <span>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>
                                            <i class="wi wi-owm-${data.weather[0].id}"></i>
                                            Météo
                                        </td>
                                        <td>
                                            ${data.weather[0].description}
                                        </td>

                                    </tr>

                                    <tr>
                                        <td class="header">
                                            <i class="wi wi-thermometer"></i>
                                            Température
                                        </td>
                                        <td>
                                            <strong>Minimum:</strong> ${data.temp.min}°C
                                            &nbsp;
                                            <strong>Moyen:</strong> ${data.temp.day}°C
                                            &nbsp;
                                            <strong>Maximum:</strong> ${data.temp.max}°C
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            <i class="wi wi-humidity"></i>
                                            Humidité
                                        </td>

                                        <td>
                                            ${data.humidity}%
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            <i class="wi wi-strong-wind"></i>
                                            Vitesse du vent
                                        </td>

                                        <td>
                                            ${data.speed} Km/h
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            <i class="wi wi-barometer"></i>
                                            Pression atmosphérique
                                        </td>

                                        <td>
                                            ${data.pressure} hPa
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </span>
                    </div>
                </li>
            `;
        }).join('\n');

        this.meteo.innerHTML = render;

        // On ouvre la météo du jour courant
        this.collapsible.open(0);
    }
}
