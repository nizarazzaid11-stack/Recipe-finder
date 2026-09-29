// ===== 1. DATA & ELEMEN =====
const API_URL = "https://dummyjson.com/recipes?limit=0"; // limit=0 -> ambil semua resep

let allRecipes = [];                                            // semua resep dari API
let favorites = JSON.parse(localStorage.getItem("favorites")) || []; // isi: array id resep

const searchInput = document.getElementById("search-input");
const mealFilter = document.getElementById("meal-filter");
const favOnly = document.getElementById("fav-only");
const statusText = document.getElementById("status");
const recipeList = document.getElementById("recipe-list");
const dialog = document.getElementById("detail-dialog");
const detailContent = document.getElementById("detail-content");
const closeBtn = document.getElementById("close-btn");


// ===== 2. FETCH DATA =====
async function getRecipes() {
  statusText.textContent = "Memuat resep...";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Gagal mengambil data");
    }
    const data = await response.json();
    allRecipes = data.recipes; // DummyJSON menaruh daftar resep di data.recipes

    fillMealOptions();
    showRecipes();
  } catch (error) {
    statusText.textContent = "Resep gagal dimuat. Cek koneksi internet lalu muat ulang halaman.";
    console.error(error);
  }
}


// ===== 3. ISI OPSI FILTER =====
// Ambil semua mealType (Dinner, Lunch, dll) tanpa duplikat
function fillMealOptions() {
  const meals = [];
  allRecipes.forEach(function (recipe) {
    recipe.mealType.forEach(function (meal) {
      if (!meals.includes(meal)) {
        meals.push(meal);
      }
    });
  });

  meals.sort().forEach(function (meal) {
    const option = document.createElement("option");
    option.value = meal;
    option.textContent = meal;
    mealFilter.appendChild(option);
  });
}


// ===== 4. SEARCH + FILTER =====
// Fungsi ini menyaring allRecipes sesuai input user, lalu menampilkannya
function showRecipes() {
  const keyword = searchInput.value.toLowerCase().trim();
  const selectedMeal = mealFilter.value;

  const result = allRecipes.filter(function (recipe) {
    const matchName = recipe.name.toLowerCase().includes(keyword);
    const matchMeal = selectedMeal === "all" || recipe.mealType.includes(selectedMeal);
    const matchFav = !favOnly.checked || favorites.includes(recipe.id);
    return matchName && matchMeal && matchFav;
  });

  renderCards(result);

  if (result.length === 0) {
    statusText.textContent = "Tidak ada resep yang cocok. Coba kata kunci atau filter lain.";
  } else {
    statusText.textContent = result.length + " resep ditemukan";
  }
}


// ===== 5. TAMPILKAN KARTU RESEP =====
function renderCards(recipes) {
  recipeList.innerHTML = "";

  recipes.forEach(function (recipe) {
    const isFav = favorites.includes(recipe.id);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
      <div class="card-body">
        <h3>${recipe.name}</h3>
        <p class="meta">${recipe.cuisine} • ${recipe.difficulty} • ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} menit</p>
        <div class="card-actions">
          <button class="detail-btn" data-id="${recipe.id}">Lihat detail</button>
          <button class="fav-btn ${isFav ? "active" : ""}" data-id="${recipe.id}"
                  aria-label="${isFav ? "Hapus dari favorit" : "Tambah ke favorit"}">
            ${isFav ? "♥" : "♡"}
          </button>
        </div>
      </div>
    `;
    recipeList.appendChild(card);
  });
}


// ===== 6. DETAIL RESEP =====
function showDetail(id) {
  const recipe = allRecipes.find(function (r) {
    return r.id === id;
  });

  const ingredients = recipe.ingredients.map(function (item) {
    return "<li>" + item + "</li>";
  }).join("");

  const steps = recipe.instructions.map(function (step) {
    return "<li>" + step + "</li>";
  }).join("");

  detailContent.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.name}">
    <div class="detail-text">
      <h2>${recipe.name}</h2>
      <p class="meta">
        ${recipe.cuisine} • ${recipe.difficulty} • ${recipe.servings} porsi •
        ${recipe.caloriesPerServing} kkal/porsi • Rating ${recipe.rating}
      </p>
      <h4>Bahan</h4>
      <ul>${ingredients}</ul>
      <h4>Langkah</h4>
      <ol>${steps}</ol>
    </div>
  `;

  dialog.showModal(); // buka popup
}


// ===== 7. FAVORIT (LocalStorage) =====
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    // sudah favorit -> hapus
    favorites = favorites.filter(function (favId) {
      return favId !== id;
    });
  } else {
    // belum favorit -> tambah
    favorites.push(id);
  }

  // simpan ke LocalStorage (harus diubah jadi string dulu)
  localStorage.setItem("favorites", JSON.stringify(favorites));

  showRecipes(); // tampilkan ulang supaya ikon hati ikut berubah
}


// ===== 8. EVENT =====
searchInput.addEventListener("input", showRecipes);
mealFilter.addEventListener("change", showRecipes);
favOnly.addEventListener("change", showRecipes);

// Satu listener untuk semua tombol di dalam daftar (event delegation)
recipeList.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.classList.contains("detail-btn")) {
    showDetail(id);
  } else if (button.classList.contains("fav-btn")) {
    toggleFavorite(id);
  }
});

closeBtn.addEventListener("click", function () {
  dialog.close();
});


// ===== 9. JALANKAN =====
getRecipes();
