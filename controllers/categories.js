const express = require("express");

const db = require("../firebase");

const router = express.Router();

async function getCategories(req, res) {
  try {
    const [snapshot] = await Promise.all([db.collection("categories").get()]);
    const categories = snapshot.docs.map((doc) => doc.data().name);
    res.send(categories);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error getting categories");
  }
}

async function createCategory(req, res) {
  try {
    const categoryName = req.body.name.toLowerCase();
    const existingCategory = await db
      .collection("categories")
      .where("name", "==", categoryName)
      .get();

    if (!existingCategory.empty) {
      res.status(400).json({ error: "Category already exists" });
      return;
    }

    const newCategoryRef = await db.collection("categories").add(req.body);
    const newCategorySnapshot = await newCategoryRef.get();
    const newCategoryData = {
      id: newCategoryRef.id,
      ...newCategorySnapshot.data(),
    };
    res.json(newCategoryData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create category" });
  }
}

module.exports = { createCategory, getCategories };
