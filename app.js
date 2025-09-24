const express = require("express");
const exphbs = require("express-handlebars");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//Database connection
const db = new sqlite3.Database("./database.db");

//Set up handlebars
app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

//Routes
app.get("/", (req, res) => {
  res.render("home", { title: "Mini Recipe Book" });
});

//Show all recipes
app.get("/recipes", (req, res) => {
  db.all("SELECT * FROM recipes", [], (err, rows) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    res.render("recipes", { title: "All Recipes", recipes: rows });
  });
});

// Show the form
app.get("/recipes/new", (req, res) => {
  res.render("addRecipe", { title: "Add Recipe" });
});

// Handle form submission
app.post("/recipes", (req, res) => {
  const { title, ingredients, instreuctions } = req.body;
  db.run(
    "INSERT INTO recipes (title, ingredients, instreuctions) VALUES (?, ?, ?)",
    [title, ingredients, instreuctions],
    function (err) {
      if (err) {
        return res.status(500).send("Database error");
      }
      res.redirect("/recipes"); // go back to the recipes list
    }
  );
});

//Single recipe view
app.get("/recipes/:id", (req, res) => {
  const recipeId = req.params.id;
  db.get("SELECT * FROM recipes WHERE id = ?", [recipeId], (err, row) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    if (!row) {
      return res.status(404).send("Recipe not found");
    }
    res.render("recipe", { title: row.title, recipe: row });
  });
});

//Delete recipe
app.post("/recipes/:id/delete", (req, res) => {
  const recipeId = req.params.id;
  db.run("DELETE FROM recipes WHERE id = ?", [recipeId], function (err) {
    if (err) {
      return res.status(500).send("Database error");
    }
    res.redirect("/recipes");
  });
});

//Edit the recipe form
app.get("/recipes/:id/edit", (req, res) => {
  const recipeId = req.params.id;
  db.get("SELECT * FROM recipes WHERE id = ?", [recipeId], (err, row) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    if (!row) {
      return res.status(404).send("Recipe not found");
    }
    res.render("editRecipe", { title: "Edit Recipe", recipe: row });
  });
});

//Handle the edits
app.post("/recipes/:id/edit", (req, res) => {
  const { title, ingredients, instreuctions } = req.body;
  const recipeId = req.params.id;

  db.run(
    "UPDATE recipes SET title = ?, ingredients = ?, instreuctions = ? WHERE id = ?",
    [title, ingredients, instreuctions, recipeId],
    function (err) {
      if (err) {
        return res.status(500).send("Database error");
      }
      res.redirect(`/recipes/${recipeId}`);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
