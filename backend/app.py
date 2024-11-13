from flask import Flask, jsonify, request, send_from_directory
import requests
import os

app = Flask(__name__)

# Obter a API Key e URL base da variável de ambiente
API_KEY = os.getenv("API_KEY")
BASE_URL = 'https://api.weatherbit.io/v2.0/'

# Servir o arquivo HTML principal e arquivos estáticos
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend', filename)

@app.route('/api/weather/current', methods=['GET'])
def get_current_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({"error": "Parâmetros 'lat' e 'lon' são necessários"}), 400
    
    # Endpoint para o clima atual
    weather_url = f"{BASE_URL}current?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    daily_url = f"{BASE_URL}forecast/daily?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    
    try:
        # Requisição para o clima atual
        response = requests.get(weather_url)
        response.raise_for_status()
        weather_data = response.json()
        data = weather_data.get("data", [{}])[0]
        
        # Requisição para a previsão diária
        daily_response = requests.get(daily_url)
        daily_response.raise_for_status()
        daily_data = daily_response.json()
        daily_forecast = daily_data.get("data", [{}])[0]

        # Extrair valores de temp, max_temp e min_temp
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
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Não foi possível obter os dados de clima", "details": str(e)}), 500



# Endpoint para obter a previsão por hora
@app.route('/api/weather/hourly', methods=['GET'])
def get_hourly_forecast():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({"error": "Parâmetros 'lat' e 'lon' são necessários"}), 400
    
    # Montar a URL da API para previsão por hora
    hourly_url = f"{BASE_URL}forecast/hourly?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    try:
        response = requests.get(hourly_url)
        response.raise_for_status()
        weather_data = response.json()

        # Formatar os dados para enviar como resposta
        hourly_data = weather_data.get("data", [])
        forecast = []

        for hour_data in hourly_data[:12]:  # Limitar a previsão para as próximas 12 horas
            forecast.append({
                "time": hour_data.get("timestamp_local", ""),
                "temp": hour_data.get("temp", 0),
                "description": hour_data.get("weather", {}).get("description", "Sem descrição")
            })

        return jsonify(forecast)
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Não foi possível obter os dados de previsão por hora", "details": str(e)}), 500

# Novo endpoint para obter a previsão diária
@app.route('/api/weather/daily', methods=['GET'])
def get_daily_forecast():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({"error": "Parâmetros 'lat' e 'lon' são necessários"}), 400
    
    # Montar a URL da API para previsão diária
    daily_url = f"{BASE_URL}forecast/daily?lat={lat}&lon={lon}&key={API_KEY}&lang=pt"
    try:
        response = requests.get(daily_url)
        response.raise_for_status()
        weather_data = response.json()

        # Formatar os dados para enviar como resposta
        daily_data = weather_data.get("data", [])
        forecast = []

        for day_data in daily_data[:5]:  # Limitar a previsão para os próximos 5 dias
            forecast.append({
                "date": day_data.get("valid_date", ""),
                "temp": day_data.get("temp", 0),
                "description": day_data.get("weather", {}).get("description", "Sem descrição")
            })

        return jsonify(forecast)
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Não foi possível obter os dados de previsão diária", "details": str(e)}), 500

# Iniciar o servidor
if __name__ == '__main__':
    app.run(debug=True)

