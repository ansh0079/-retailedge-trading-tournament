import requests
import json

api_key = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz'
symbol = 'AAPL'
url = f'https://financialmodelingprep.com/stable/financial-growth?symbol={symbol}&limit=1&apikey={api_key}'

try:
    response = requests.get(url)
    data = response.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
