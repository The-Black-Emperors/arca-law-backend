const puppeteer = require('puppeteer-core');

async function scrapeProcessUpdates(processUrl) {
    const chromium = (await import('@sparticuz/chromium')).default;
    let browser = null;
    let scrapedUpdates = [];

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.goto(processUrl, { waitUntil: 'networkidle2' });
        
        scrapedUpdates = await page.evaluate(() => {
            const results = [];
            const rows = document.querySelectorAll('#tabelaTodasMovimentacoes tr');
            rows.forEach(row => {
                const columns = row.querySelectorAll('td');
                if (columns.length >= 2) {
                    const dateText = columns[0].innerText.trim();
                    const descriptionText = columns[1].innerText.trim().replace(/\s+/g, ' ');
                    if (dateText && descriptionText) {
                        results.push({
                            date: dateText,
                            description: descriptionText
                        });
                    }
                }
            });
            return results;
        });

    } catch (error) {
        console.error("Erro no scraperService:", error);
        throw new Error("Não foi possível buscar as movimentações do processo.");
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
    
    return scrapedUpdates;
}

module.exports = {
    scrapeProcessUpdates
};