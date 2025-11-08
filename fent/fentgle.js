const fentgleAPI = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
window.onload = function() {
    loadmeals();
};

async function loadmeals() {
    try {
        //printing loading
        document.getElementById("main-container").innerHTML = "<h3>Loading...</h3>";
        //fetch data from API
        const response = await fetch(fentgleAPI);
        //bad connection
        if (!response.ok) throw new Error("Bad connection");
        //extract data from response, object to json
        const data = await response.json();
        //render meal list
        renderMeal(data)
    } catch (error) {
        //if fectch fail by bad connection
        document.getElementById("main-container").innerHTML = `<h3>Can't load data</h3>`;
    }
} 
function renderMeal(meals) {
    const html = meals.meals.map(meal =>
        `<div class="meal-card">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
        <h3>${meal.strMeal}</h3>
        <p>${meal.strArea} - ${meal.strCategory}</p>
    </div> `
    ).join(``);
    document.getElementById("main-container").innerHTML = html;
}