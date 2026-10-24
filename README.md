# Stock Market Deluxe - Card

A stock card for your Home Assistant dashboard. Pick any stock and the card shows its price, today's change, a chart, and what your own shares are worth. Quotes come from Yahoo Finance, so you don't need an account or an API key.

![The card showing Tesla stock](https://raw.githubusercontent.com/codemonkey2k5/stock-market-deluxe-card/main/docs/images/card.png)

## What you get

- The current price and how much it moved today, in green or red.
- A green dot next to the name while the market is open.
- A chart for 1 day, 5 days, 1 month, 3 months or 1 year, with trading volume and two trend lines.
- Your position: how many shares you own, what they're worth now, and how much that changed today.
- A grid of facts about the company, like its market cap and its 52-week high and low.
- A settings button on the card for all the settings. You never have to type any code.
- A sensor for each stock you show (for example `sensor.stock_tsla`), so you can use the price in automations too.

## Install

You need [HACS](https://hacs.xyz) in your Home Assistant. If you already add things from HACS, this works the same way.

1. Click this button to open the card in HACS:

   [![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=codemonkey2k5&repository=stock-market-deluxe-card&category=integration)

2. Click **Download** in the lower right corner, then **Download** again.
3. Restart Home Assistant. You can do this from **Settings** > **System**, using the power button in the top right.
4. Click this button to finish the setup, then click **Submit**:

   [![Add integration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=stock_market_deluxe_card)

That's the whole install. The card is now available in the card picker. Open any dashboard, choose **Edit**, then **Add card**, and search for **Stock Market Deluxe**.

## Add the card to a dashboard

1. Open a dashboard and click the pencil in the top right to edit it.
2. Click **Add card** and search for **Stock Market Deluxe**.
3. Pick it and click **Save**. The picker shows a sample of the card. Yours starts with Apple (AAPL).
4. Click **Done** to stop editing.

Then click the settings button on the card to change the stock and the other settings. The card is happiest with some room. If it looks small, edit the dashboard and drag the card wider.

## The settings button

![The settings window](https://raw.githubusercontent.com/codemonkey2k5/stock-market-deluxe-card/main/docs/images/settings.png)

- **Stock symbol.** The short code a stock trades under, like TSLA for Tesla or AAPL for Apple. Type it and the card looks it up and shows the company name, so you know you got the right one.
- **Shares owned.** How many shares you have. The card uses this to work out what they're worth. Leave it at 0 if you just want to watch the price.
- **Current Value and Statement date.** These are optional. If you know what your shares were worth on a certain day, like the date on a brokerage statement, enter that value and the date. The card starts from that value and follows the price from that day on. Leave both blank and the card just multiplies your shares by the price.
- **Show on the card.** Tick or untick each part of the card. Hide what you don't need and the chart gets the extra room.
- **Refresh interval.** How often the card gets a new price.

Your settings are saved in Home Assistant, so the card looks the same on your phone, tablet and computer.

## What the numbers mean

- **Open:** the price when the market opened this morning.
- **High:** the highest price today.
- **Low:** the lowest price today.
- **Prev Close:** the price when the market closed on the last trading day.
- **Volume:** how many shares changed hands today, next to the usual daily amount.
- **Market Cap:** what the whole company is worth at today's price.
- **52W High / Low:** the highest and lowest price over the past year.
- **PE:** the price divided by the profit per share over the past year. People use it to judge whether a stock is cheap or expensive.
- **EPS:** the company's profit per share over the past year.
- **Beta:** how much the stock tends to swing compared with the market as a whole. Above 1 means bigger swings.
- **After Hours / Pre-Market:** the price in trading outside normal market hours.
- **RSI:** a number from 0 to 100 that hints whether a stock rose or fell a lot in a short time. Many people read above 70 as "ran up fast" and below 30 as "dropped fast".
- **SMA and EMA:** the blue and orange lines on the chart. Both are averages of recent prices, which make the trend easier to see.

## How often it refreshes

The card gets a new price at most every 3 minutes while the market is open, and at most every 10 minutes when it's closed. You can pick a slower refresh in the settings window, but not a faster one.

Yahoo lets anyone read these prices for free. Asking too often could get your home blocked for a while, and it isn't fair to a free service. These limits keep both from happening. If you show the same stock on several cards or screens, they share one update.

## Questions and fixes

**The card says "Custom element doesn't exist" or looks out of date after an update.**
Your browser is holding on to the old version. Do a hard refresh: press Ctrl+Shift+R (Cmd+Shift+R on a Mac). In the Home Assistant phone app, use **Reset frontend cache** in the app's settings.

**The green dot is gone.**
The dot only shows while the market is open for regular trading. Outside those hours, on weekends and on holidays, it says "Market closed" instead. Nothing is wrong.

**The price hasn't changed for a while.**
When the market is closed, the price stays put until it opens again. During market hours, the card follows the refresh interval you picked.

**It says Yahoo is rate limiting.**
Yahoo asked for a short break. The card shows the last prices it got and tries again on its own.

**The card says the integration is not set up.**
Do step 4 of the install again. If you can't find it, go to **Settings** > **Devices & services**, click **Add integration** and search for Stock Market Deluxe.

**I copied a card and now both show the same stock.**
Open the copy in the dashboard editor (pencil, then click the card) and click **Save**. The card gets its own ID, so its settings are kept apart. Then pick the stock again with the settings button.

**The company logo is missing.**
Some companies don't have a logo available. The card shows the stock symbol in its place.

## Credits and disclaimers

- Stock prices and company data come from Yahoo Finance through its public web endpoints. These aren't an official API, and Yahoo could change or stop them at any time. This project isn't affiliated with, endorsed by or connected to Yahoo. Your use of the data falls under Yahoo's terms, and it's meant for personal use.
- Prices can be delayed and may contain errors. Nothing on this card is financial advice. Check with a proper source before you buy or sell anything.
- Company logos come from the image service of Financial Modeling Prep. Logos, company names and stock symbols are trademarks of their owners and are shown only to identify the stock.
- The icons on the card were drawn for this project. The card uses no outside code libraries or bundled fonts. It uses the Roboto font if your device already has it.
- Home Assistant is a trademark of the Open Home Foundation. HACS is a community project. This project isn't affiliated with or endorsed by either.

## License

MIT. See [LICENSE](LICENSE).
