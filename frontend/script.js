async function fetchWeather(lat, lon) {
    const url = `/api/weather/current?lat=${lat}&lon=${lon}`;
    console.log('coordenadas recebidas latitude: ', lat);
    console.log('coordenadas recebidas longitude: ', lon);
    const response = await fetch(url);
    const data = await response.json();
    console.log("Resposta da API de clima:", data);
    return data;
}

let horaAtualIndex = 0; // Índice para controlar a hora exibida
let diaAtualIndex = 0; // Índice para controlar o dia exibido
let previsaoPorHora = []; // Array para armazenar a previsão horária
let previsaoDiaria = []; // Array para armazenar a previsão diária

// Função para buscar a previsão horária
async function fetchHourlyForecast(lat, lon) {
    const url = `/api/weather/hourly?lat=${lat}&lon=${lon}`;
    const response = await fetch(url);
    const data = await response.json();
    previsaoPorHora = data; // Armazena a previsão horária para uso na navegação
    console.log("Previsão horária:", data);
    updateHourlyForecast(); // Atualiza a exibição inicial
}

// Função para buscar a previsão dos próximos dias
async function fetchDailyForecast(lat, lon) {
    const url = `/api/weather/daily?lat=${lat}&lon=${lon}`;
    const response = await fetch(url);
    const data = await response.json();
    
    previsaoDiaria = data; // Armazena a previsão diária para exibir
    console.log("Previsão diária:", data);
    
    // Filtra para incluir apenas previsões futuras e limita a 5 dias
    const today = new Date().setHours(0, 0, 0, 0);
    previsaoDiaria = data.filter(day => new Date(day.date).setHours(0, 0, 0, 0) > today).slice(0, 5);
    console.log("Previsão diária (ajustada):", previsaoDiaria); 

    updateDailyForecast(); // Atualiza a exibição da previsão diária
}

// Função para atualizar a exibição da previsão diária
function updateDailyForecast() {
    const dailyForecastContainer = document.getElementById('daily-forecast');
    dailyForecastContainer.innerHTML = ''; // Limpar previsões anteriores

    const day = previsaoDiaria[diaAtualIndex]; // Obter o dia atual para exibir
    if (day) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';

        const date = new Date(day.date).toLocaleDateString(); // Formata a data
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

// Função para alterar o dia exibido na previsão diária
function alterarDia(direcao) {
    const novoIndex = diaAtualIndex + direcao;
    // Verifica se o novo índice está dentro dos limites do array
    if (novoIndex >= 0 && novoIndex < previsaoDiaria.length) {
        diaAtualIndex = novoIndex;
        updateDailyForecast();
    }
}

function updateWeather(data) {
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temperature').textContent = `${data.main.temp.toFixed(0)}°C`;
    document.getElementById('weather-description').textContent = data.weather[0].description;
    document.getElementById('max-min').textContent = `Máx.: ${data.main.temp_max.toFixed(0)}° Mín.: ${data.main.temp_min.toFixed(0)}°`;

    let recommendation = '';

    // Lógica condicional para recomendações de vestimenta e hidratação
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

function updateHourlyForecast() {
    const hourlyForecastContainer = document.getElementById('hourly-forecast');
    hourlyForecastContainer.innerHTML = ''; // Limpar previsões anteriores

    // Obtém a previsão da hora atual
    const hour = previsaoPorHora[horaAtualIndex];
    if (hour) {
        const hourElement = document.createElement('div');
        hourElement.className = 'hour';

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

// Função para alterar a hora exibida na previsão horária
function alterarHora(direcao) {
    const novoIndex = horaAtualIndex + direcao;
    // Verifica se o novo índice está dentro dos limites do array
    if (novoIndex >= 0 && novoIndex < previsaoPorHora.length) {
        horaAtualIndex = novoIndex;
        updateHourlyForecast();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Chama a API com a localização do usuário para obter o clima atual
                fetchWeather(lat, lon).then(data => updateWeather(data));

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

