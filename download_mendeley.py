import requests
from bs4 import BeautifulSoup
import re
import json

url = "https://data.mendeley.com/public-api/datasets/3t3dk43bv9/1"
try:
    res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    print(res.status_code)
    data = res.json()
    for file in data.get('files', []):
        print(f"Found file: {file.get('filename')}")
        print(f"URL: {file.get('content_details', {}).get('download_url')}")
except Exception as e:
    print(f"API Error: {e}")
