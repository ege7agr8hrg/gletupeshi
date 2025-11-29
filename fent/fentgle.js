// ...existing code...
const fentgleAPI = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const fentgleByLetter = "https://www.themealdb.com/api/json/v1/1/search.php?f=";

window.onload = function() {
    loadmeals();
    setupSearch();
    updateAuthUI();
};

async function loadmeals(apiUrl = fentgleAPI) {
    try {
        document.getElementById("main-container").innerHTML = "<h3>Loading...</h3>";
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Bad connection");
        const data = await response.json();
        renderMeal(data);
    } catch (error) {
        document.getElementById("main-container").innerHTML = `<h3>Can't load data</h3>`;
        console.error(error);
    }
} 

function renderMeal(meals) {
    const list = (meals && meals.meals) || [];
    const q = (window._lastQuery || '').toLowerCase().trim();
    const filtered = q ? list.filter(m => (m.strMeal || '').toLowerCase().includes(q)) : list;

    if (!filtered.length) {
        document.getElementById("main-container").innerHTML = `<h3>No results</h3>`;
        return;
    }
    const html = filtered.map(meal =>
        `<div class="meal-card" data-id="${meal.idMeal}">
            <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}"/>
            <h3>${escapeHtml(meal.strMeal)}</h3>
            <p>${escapeHtml(meal.strArea)} - ${escapeHtml(meal.strCategory)}</p>
        </div>`
    ).join('');
    document.getElementById("main-container").innerHTML = html;

    // wire up clicks to show modal with meal details
    document.querySelectorAll('.meal-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const mealId = e.currentTarget.dataset.id;
            // require login: redirect to login page if not logged in
            if (!isLoggedin()){
                // redirect to your existing login page (you said you'll add login button later)
                window.location.href = './fentglelogin.html';
                return;
            }
            openMealModal(mealId);
        });
    });
}

async function openMealModal(mealId) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await res.json();
        const meal = (data.meals && data.meals[0]) || null;
        if (!meal) throw new Error('Meal not found');
        document.getElementById("main-container").style.filter='blur(3px)';
        document.getElementById("topbar").style.filter='blur(3px)';
        document.getElementById('diddy').style.filter='blur(3px)';
        document.getElementById('footer').style.filter='blur(3px)';
        // build ingredients list
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing) ingredients.push(`${measure || ''} ${ing}`.trim());
        }

        // build and insert modal
        const modalHtml = `
            <div class="modal-overlay" id="mealModal">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeMealModal()">&times;</button>
                    <h1>Meal Details</h1>
                    <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" class="modal-img">
                    <h2>${escapeHtml(meal.strMeal)}</h2>
                    <p><strong>Category:</strong> ${escapeHtml(meal.strCategory)}</p>
                    <p><strong>Area:</strong> ${escapeHtml(meal.strArea)}</p>
                    <h3>Ingredients</h3>
                    <ul>
                        ${ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
                    </ul>
                    <h3>Instructions</h3>
                    <p>${(meal.strInstructions || '').replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // close on overlay click
        document.getElementById('mealModal').addEventListener('click', (e) => {
            if (e.target.id === 'mealModal') closeMealModal();
        });
    } catch (err) {
        alert('Failed to load meal: ' + err.message);
    }
}

function closeMealModal() {
    const modal = document.getElementById('mealModal');
    const main = document.getElementById("main-container");
    const top = document.getElementById("topbar");
    const diddy = document.getElementById('diddy');
    const footer = document.getElementById('footer');

    // if modal not present, ensure blur cleared and exit
    if (!modal) {
        if (main) main.style.filter = 'blur(0)';
        if (top) top.style.filter = 'blur(0)';
        if (diddy) diddy.style.filter = 'blur(0)';
        if (footer) footer.style.filter = 'blur(0)';
        return;
    }

    // play closing animation
    modal.classList.add('closing');

    // remove modal and clear blur after animation finishes
    modal.addEventListener('animationend', () => {
        modal.remove();
        if (main) main.style.filter = 'blur(0)';
        if (top) top.style.filter = 'blur(0)';
        if (diddy) diddy.style.filter = 'blur(0)';
        if (footer) footer.style.filter = 'blur(0)';
    }, { once: true });
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
        window._lastQuery = v;

        if (!v){
            loadmeals();
            return;
        }
        const first = v[0].match(/[a-z]/i) ? v[0] : '';
        if (v.length === 1 && first) {
            loadmeals(fentgleByLetter + encodeURIComponent(first));
        } else {
            loadmeals(fentgleAPI + encodeURIComponent(v));
        }
    }, 220));
}
function isLoggedin(){
    // primary flag used by app
    return !!localStorage.getItem('fentgle_user');
}
function updateAuthUI() {
    const btn = document.getElementById('authBtn');
    if (!btn) return;
    if (isLoggedin()) {
        btn.textContent = 'Logout';
        btn.onclick = () => {
            localStorage.removeItem('fentgle_user');
            updateAuthUI();
        };
    } else {
        btn.textContent = 'Login';
        btn.onclick = () => {
            window.location.href = './fentglelogin.html';
        };
    }
}
function escapeHtml(s){return String(s||'').replace(/[&<>"'`=\/]/g,m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;','=':'&#x3D;','/':'&#x2F;'}[m]));}