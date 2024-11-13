from flask import Flask, jsonify, request, send_from_directory
import requests
import os

app = Flask(__name__)

# Obter a API Key e URL base da variável de ambiente
API_KEY = os.getenv("API_KEY")
BASE_URL = 'https://api.weatherbit.io/v2.0/'

# Função auxiliar para verificar parâmetros obrigatórios
def check_coordinates():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error": "Parâmetros 'lat' e 'lon' são necessários"}), 400
    return lat, lon

# Função auxiliar para realizar requisições à API
def fetch_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Não foi possível obter os dados", "details": str(e)}), 500

# Servir o arquivo HTML principal e arquivos estáticos
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend', filename)

# Endpoint para clima atual
@app.route('/api/weather/current', methods=['GET'])
def get_current_weather():
    lat_lon = check_coordinates()
    if isinstance(lat_lon, tuple):
        lat, lon = lat_lon
    else:
        return lat_lon  # Retorna erro se coordenadas forem inválidas

    # URLs da API para clima atual e previsão diária
    weather_url = f"{BASE_URL}current?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    daily_url = f"{BASE_URL}forecast/daily?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"

    # Busca dados de clima atual e previsão diária
    weather_data = fetch_data(weather_url)
    daily_data = fetch_data(daily_url)
    if isinstance(weather_data, dict) and isinstance(daily_data, dict):
        data = weather_data.get("data", [{}])[0]
        daily_forecast = daily_data.get("data", [{}])[0]
        
        # Formatação dos dados
        formatted_data = {
            "name": data.get("city_name", "Desconhecido"),
            "main": {
                "temp": data.get("temp", 0),
                "temp_max": daily_forecast.get("max_temp", data.get("temp", 0)),
                "temp_min": daily_forecast.get("min_temp", data.get("temp", 0))
            },
            "weather": [{
                "description": data.get("weather", {}).get("description", "Sem descrição")
            }]
        }
        return jsonify(formatted_data)
    else:
        return weather_data  # Retorna erro se falhar

# Endpoint para previsão horária
@app.route('/api/weather/hourly', methods=['GET'])
def get_hourly_forecast():
    lat_lon = check_coordinates()
    if isinstance(lat_lon, tuple):
        lat, lon = lat_lon
    else:
        return lat_lon

    hourly_url = f"{BASE_URL}forecast/hourly?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    weather_data = fetch_data(hourly_url)
    if isinstance(weather_data, dict):
        hourly_data = weather_data.get("data", [])
        forecast = [
            {
                "time": hour_data.get("timestamp_local", ""),
                "temp": hour_data.get("temp", 0),
                "description": hour_data.get("weather", {}).get("description", "Sem descrição")
            }
            for hour_data in hourly_data[:12]
        ]
        return jsonify(forecast)
    else:
        return weather_data

# Endpoint para previsão diária
@app.route('/api/weather/daily', methods=['GET'])
def get_daily_forecast():
    lat_lon = check_coordinates()
    if isinstance(lat_lon, tuple):
        lat, lon = lat_lon
    else:
        return lat_lon

    daily_url = f"{BASE_URL}forecast/daily?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    weather_data = fetch_data(daily_url)
    if isinstance(weather_data, dict):
        daily_data = weather_data.get("data", [])
        forecast = [
            {
                "date": day_data.get("valid_date", ""),
                "temp": day_data.get("temp", 0),
                "description": day_data.get("weather", {}).get("description", "Sem descrição")
            }
            for day_data in daily_data[:5]
        ]
        return jsonify(forecast)
    else:
        return weather_data

# Iniciar o servidor
if __name__ == '__main__':
    app.run(debug=True)


