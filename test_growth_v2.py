import urllib.request
import json

api_key = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz'
symbol = 'AAPL'
url = f'https://financialmodelingprep.com/stable/financial-growth?symbol={symbol}&limit=1&apikey={api_key}'

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
