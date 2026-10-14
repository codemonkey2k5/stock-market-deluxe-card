DOMAIN = "stock_market_deluxe_card"
VERSION = "1.0.1"
URL_BASE = "/stock_market_deluxe_card"
CARD_FILE = "stock-market-deluxe-card.js"
CARD_URL = f"{URL_BASE}/{CARD_FILE}"
STORE_KEY = f"{DOMAIN}.cards"
STORE_VERSION = 1
# Choices offered in the settings dialog, in seconds. Nothing below 3 minutes.
INTERVAL_CHOICES = [180, 300, 600, 900, 1800, 3600]
SIGNAL_UPDATE = f"{DOMAIN}_update"
SIGNAL_NEW = f"{DOMAIN}_new_symbol"
