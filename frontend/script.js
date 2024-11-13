// Função para buscar dados de clima atual a partir das coordenadas fornecidas
async function fetchWeather(lat, lon) {
    const url = `/api/weather/current?lat=${lat}&lon=${lon}`;
    console.log(`Coordenadas recebidas: latitude = ${lat}, longitude = ${lon}`);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Resposta da API de clima:", data);
        return data;
    } catch (error) {
        console.error("Erro ao buscar dados de clima:", error);
        return null;
    }
}

// Variáveis para controle dos índices das previsões horária e diária
let horaAtualIndex = 0; // Índice para controle da previsão horária exibida
let diaAtualIndex = 0;  // Índice para controle da previsão diária exibida

// Arrays para armazenar as previsões horárias e diárias
let previsaoPorHora = [];
let previsaoDiaria = [];

// Função para buscar a previsão horária e armazená-la no array previsaoPorHora
async function fetchHourlyForecast(lat, lon) {
    const url = `/api/weather/hourly?lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        previsaoPorHora = data;
        console.log("Previsão horária:", data);
        updateHourlyForecast(); // Atualiza a exibição inicial
    } catch (error) {
        console.error("Erro ao buscar previsão horária:", error);
    }
}

// Função para buscar a previsão diária e filtrar os próximos 5 dias
async function fetchDailyForecast(lat, lon) {
    const url = `/api/weather/daily?lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Filtra para incluir apenas previsões futuras e limita a 5 dias
        const today = new Date().setHours(0, 0, 0, 0);
        previsaoDiaria = data.filter(day => new Date(day.date).setHours(0, 0, 0, 0) > today).slice(0, 5);
        console.log("Previsão diária (ajustada):", previsaoDiaria);

        updateDailyForecast(); // Atualiza a exibição inicial
    } catch (error) {
        console.error("Erro ao buscar previsão diária:", error);
    }
}

// Função para atualizar a exibição da previsão diária na interface
function updateDailyForecast() {
    const dailyForecastContainer = document.getElementById('daily-forecast');
    dailyForecastContainer.innerHTML = ''; // Limpar previsões anteriores

    const day = previsaoDiaria[diaAtualIndex]; // Obter o dia atual para exibir
    if (day) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';

        // Formata a data e temperatura para exibição
        const date = new Date(day.date).toLocaleDateString();
        const temp = `${day.temp.toFixed(0)}°C`;
        const description = day.description;

        dayElement.innerHTML = `
            <p><strong>${date}</strong></p>
            <p>${temp}</p>
            <p>${description}</p>
        `;

        dailyForecastContainer.appendChild(dayElement);
    }
}

// Função para alterar o índice do dia exibido na previsão diária
function alterarDia(direcao) {
    const novoIndex = diaAtualIndex + direcao;
    // Verifica se o novo índice está dentro dos limites do array
    if (novoIndex >= 0 && novoIndex < previsaoDiaria.length) {
        diaAtualIndex = novoIndex;
        updateDailyForecast();
    }
}

// Função para atualizar a exibição dos dados de clima atual na interface
function updateWeather(data) {
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temperature').textContent = `${data.main.temp.toFixed(0)}°C`;
    document.getElementById('weather-description').textContent = data.weather[0].description;
    document.getElementById('max-min').textContent = `Máx.: ${data.main.temp_max.toFixed(0)}° Mín.: ${data.main.temp_min.toFixed(0)}°`;

    // Recomendações de vestimenta com base na temperatura atual
    let recommendation = '';
    if (data.main.temp <= 10) {
        recommendation = 'Se agasalhe, está frio!';
    } else if (data.main.temp > 10 && data.main.temp <= 17) {
        recommendation = 'Temperatura amena, leve um casaco leve.';
    } else if (data.main.temp > 17 && data.main.temp <= 27) {
        recommendation = 'Está calor, não se esqueça de beber água!';
    } else {
        recommendation = 'Calor extremo!!! Mantenha-se hidratado e evite o sol direto!';
    }

    // Exibir a recomendação
    document.getElementById('weather-alert').textContent = recommendation;
}

// Função para atualizar a exibição da previsão horária na interface
function updateHourlyForecast() {
    const hourlyForecastContainer = document.getElementById('hourly-forecast');
    hourlyForecastContainer.innerHTML = ''; // Limpar previsões anteriores

    // Obtém a previsão da hora atual
    const hour = previsaoPorHora[horaAtualIndex];
    if (hour) {
        const hourElement = document.createElement('div');
        hourElement.className = 'hour';

        // Formata a hora e temperatura para exibição
        const time = new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = `${hour.temp.toFixed(0)}°C`;
        const description = hour.description;

        hourElement.innerHTML = `
            <p><strong>${time}</strong></p>
            <p>${temp}</p>
            <p>${description}</p>
        `;

        hourlyForecastContainer.appendChild(hourElement);
    }
}

// Função para alterar o índice da hora exibida na previsão horária
function alterarHora(direcao) {
    const novoIndex = horaAtualIndex + direcao;
    // Verifica se o novo índice está dentro dos limites do array
    if (novoIndex >= 0 && novoIndex < previsaoPorHora.length) {
        horaAtualIndex = novoIndex;
        updateHourlyForecast();
    }
}

// Configuração inicial: obtém a localização do usuário e faz as requisições de API
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Chama a API com a localização do usuário para obter o clima atual
                fetchWeather(lat, lon).then(data => {
                    if (data) updateWeather(data);
                });

                // Chama a API para obter a previsão horária
                fetchHourlyForecast(lat, lon);

                // Chama a API para obter a previsão diária
                fetchDailyForecast(lat, lon);
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
                document.getElementById('city-name').textContent = "Localização não encontrada";
            }
        );
    } else {
        document.getElementById('city-name').textContent = "Geolocalização não suportada";
    }
});


