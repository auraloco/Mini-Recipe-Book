const express = require("express");
const exphbs = require("express-handlebars");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcrypt");
const { text } = require("body-parser");

const app = express();
const PORT = 3000;

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//Session
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "SuperSecretKey123",
  })
);

//Database connection
const db = new sqlite3.Database("./database.db");

//Set up handlebars
const hbs = exphbs.create({
  helpers: {
    increment: (value) => value + 1,
    decrement: (value) => value - 1,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    eq: (a, b) => a === b,
  },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");

//Middleware to make the session data accessible in the templates
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

//Home
app.get("/", (req, res) => {
  res.render("home", { title: "Mini Recipe Book" });
});

//Sign up page
app.get("/signup", (re, res) => {
  res.render("signup", { title: "Sign Up" });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    (err) => {
      if (err) {
        req.session.message = {
          type: "error",
          text: "Username already exists!",
        };
        return res.redirect("/signup");
      }
      req.session.message = {
        type: "success",
        text: "Account created! Please log in.",
      };
      res.redirect("/login");
    }
  );
});

//Login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user) {
        req.session.message = { type: "error", text: "User not found." };
        return res.redirect("/login");
      }

      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = { id: user.id, username: user.username };
        req.session.message = { type: "success", text: "Login successful!" };
        res.redirect("/recipes");
      } else {
        req.session.message = { type: "error", text: "Incorrect password." };
        res.redirect("/login");
      }
    }
  );
});

//Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//About page
app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});

//Contact page
app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact" });
});

//
// User specific recipes with pagination
app.get("/recipes", (req, res) => {
  if (!req.session.user) {
    req.session.message = {
      type: "error",
      text: "Please log in to view your recipes.",
    };
    return res.redirect("/login");
  }

  const userId = req.session.user.id;
  const limit = 3;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  //Total recipes
  db.get(
    "SELECT COUNT(*) AS count FROM recipes WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).send("Database error");

      const totalRecipes = result.count;
      const totalPages = Math.ceil(totalRecipes / limit);

      //Get recipes for this page
      db.all(
        "SELECT * FROM recipes WHERE user_id = ? LIMIT ? OFFSET ?",
        [userId, limit, offset],
        (err, rows) => {
          if (err) return res.status(500).send("Database error");

          const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

          res.render("recipes", {
            title: "My Recipes",
            recipes: rows,
            currentPage: page,
            totalPages,
            pages,
          });
        }
      );
    }
  );
});

//
//Show the form in add recipe
app.get("/recipes/new", (req, res) => {
  if (!req.session.user) {
    req.session.message = {
      type: "error",
      text: "Please log in to add a recipe.",
    };
    return res.redirect("/login");
  }
  res.render("addRecipe", { title: "Add Recipe" });
});

app.post("/recipes", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { title, ingredients, instreuctions } = req.body;

  db.run(
    "INSERT INTO recipes (title, ingredients, instreuctions, user_id) VALUES (?, ?, ?, ?)",
    [title, ingredients, instreuctions, req.session.user.id],
    function (err) {
      if (err) {
        return res.status(500).send("Database error");
      }
      req.session.message = {
        type: "success",
        text: "Recipe added successfully!",
      };
      res.redirect("/recipes"); //go back to the recipes list
    }
  );
});

//
//Single recipe view
app.get("/recipes/:id", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  db.get(
    `SELECT * FROM recipes WHERE id = ? AND user_id = ?`,
    [req.params.id, req.session.user.id],
    (err, row) => {
      if (err) return res.status(500).send("Database error");
      if (!row) return res.status(404).send("Recipe not found");
      res.render("recipe", { title: row.title, recipe: row });
    }
  );
});

//Form to edit the recipe
app.get("/recipes/:id/edit", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  db.get(
    "SELECT * FROM recipes WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.user.id],
    (err, row) => {
      if (err) return res.status(500).send("Database error");
      if (!row) return res.status(404).send("Recipe not found");
      res.render("editRecipe", { title: "Edit Recipe", recipe: row });
    }
  );
});

//Handle the edit, add them to database
app.post("/recipes/:id/edit", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { title, ingredients, instreuctions } = req.body;

  db.run(
    "UPDATE recipes SET title = ?, ingredients = ?, instreuctions = ? WHERE id = ? AND user_id = ?",
    [title, ingredients, instreuctions, req.params.id, req.session.user.id],
    function (err) {
      if (err) {
        return res.status(500).send("Database error");
      }
      req.session.message = {
        type: "success",
        text: "Recipe updated successfully!",
      };
      res.redirect(`/recipes/${req.params.id}`);
    }
  );
});

//Delete the recipe
app.post("/recipes/:id/delete", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  db.run(
    "DELETE FROM recipes WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.user.id],
    function (err) {
      if (err) return res.status(500).send("Database error");
      req.session.message = { type: "error", text: "Recipe deleted!" };
      res.redirect("/recipes");
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
