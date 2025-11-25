const API_BASE = ''; 

const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const resultArea = document.getElementById('resultArea');
const shortLink = document.getElementById('shortLink');
const copyBtn = document.getElementById('copyBtn');
const errorEl = document.getElementById('error');

function showError(text){ 
    errorEl.hidden = false; 
    errorEl.textContent = text; 
}

function hideError(){ 
    errorEl.hidden = true; 
    errorEl.textContent = ''; 
}

function buildShortUrl(slugOrUrl){
    try{
        const u = new URL(slugOrUrl);
        return slugOrUrl; 
    }catch(e){
        const base = API_BASE.replace(/\/$/,'');
        return base + '/' + slugOrUrl.replace(/^\/+/, '');
    }
}

async function shorten(){
    hideError();
    resultArea.hidden = true;
    const longUrl = urlInput.value.trim();
    
    if(!longUrl){ 
        showError('Введите ссылку'); 
        return; 
    }

    try{ 
        new URL(longUrl); 
    } catch(e){ 
        showError('Неправильный URL. Укажите полный URL с http(s)'); 
        return; 
    }

    shortenBtn.disabled = true; shortenBtn.textContent = 'Сокращаем...';
    
    try{
        const resp = await fetch(API_BASE + '/short_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ long_url: longUrl })
        });

        if(!resp.ok){
            const txt = await resp.text().catch(()=>null);
            throw new Error('Ошибка сервера: ' + resp.status + (txt? ' — ' + txt : ''));
        }

        const data = await resp.json();
        if(!data || data.data === undefined){ throw new Error('Неверный формат ответа от сервера'); }

        const short = buildShortUrl(String(data.data));
        shortLink.href = short;
        shortLink.textContent = short;
        resultArea.hidden = false;

    } catch(err){
        console.error(err);
        showError(err.message);
    } finally {
        shortenBtn.disabled = false; shortenBtn.textContent = 'Сократить';
    }
}

    shortenBtn.addEventListener('click', shorten);
    urlInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') shorten(); });

    copyBtn.addEventListener('click', async ()=>{
    try{
        await navigator.clipboard.writeText(shortLink.href);
        copyBtn.textContent = 'Скопировано!';
        setTimeout(()=> copyBtn.textContent = 'Копировать', 2000);
    }catch(e){
        showError('Не удалось скопировать в буфер обмена');
    }
});
