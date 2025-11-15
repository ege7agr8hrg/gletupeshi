const fentgleAPI = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const fentgleByLetter = "https://www.themealdb.com/api/json/v1/1/search.php?f=";

window.onload = function() {
    loadmeals();
    setupSearch();
};

async function loadmeals(apiUrl = fentgleAPI) {
    try {
        // printing loading
        document.getElementById("main-container").innerHTML = "<h3>Loading...</h3>";
        // fetch data from API (use apiUrl param)
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Bad connection");
        const data = await response.json();
        // render meal list (data is the API response object)
        renderMeal(data);
    } catch (error) {
        document.getElementById("main-container").innerHTML = `<h3>Can't load data</h3>`;
        console.error(error);
    }
} 

function renderMeal(meals) {
    // meals is API response like { meals: [...] } or { meals: null }
    const list = (meals && meals.meals) || [];
    const q = (window._lastQuery || '').toLowerCase().trim();

    // if we have a query, filter client-side for substring matches
    const filtered = q ? list.filter(m => (m.strMeal || '').toLowerCase().includes(q)) : list;

    if (!filtered.length) {
        document.getElementById("main-container").innerHTML = `<h3>No results</h3>`;
        return;
    }
    const html = filtered.map(meal =>
        `<div class="meal-card">
            <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}"/>
            <h3>${escapeHtml(meal.strMeal)}</h3>
            <p>${escapeHtml(meal.strArea)} - ${escapeHtml(meal.strCategory)}</p>
        </div>`
    ).join('');
    document.getElementById("main-container").innerHTML = html;
}

function setupSearch() {
    const input = document.getElementById('searchinput');
    if(!input) return;
    const debounce = (fn,ms = 250) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    };
    input.addEventListener('input', debounce((e) => {
        const v = (e.target.value || '').trim();
        window._lastQuery = v; // store current query for render filtering

        if (!v){
            loadmeals();
            return;
        }
        const first = v[0].match(/[a-z]/i) ? v[0] : '';
        if (v.length === 1 && first) {
            // single-letter: use letter endpoint (f=)
            loadmeals(fentgleByLetter + encodeURIComponent(first));
        } else {
            // multi-char: use full-search endpoint (s=) then filter client-side
            loadmeals(fentgleAPI + encodeURIComponent(v));
        }
    }, 220));
}
function escapeHtml(s){return String(s||'').replace(/[&<>"'`=\/]/g,m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;','=':'&#x3D;','/':'&#x2F;'}[m]));}