const express = require("express");

const db = require("../firebase");

const router = express.Router();

async function getCategories() {
  const categoriesRef = db.collection("categories");
  return categoriesRef.get().then((snapshot) => {
    return snapshot.docs.map((doc) => doc.data().name);
  });
}

async function createSentence(req, res) {
  const newSentence = req.body;
  const invalidCategories = [];

  let categoryIds;
  categoryIds = await Promise.all(
    newSentence.categories.map(async (categoryName) => {
      const snapshot = await db
        .collection("categories")
        .where("name", "==", categoryName)
        .get();
      if (snapshot.empty) {
        invalidCategories.push(categoryName);
        return null;
      } else {
        const doc = snapshot.docs[0];
        return doc.id;
      }
    })
  );

  const categoriesExist = categoryIds.every(
    (categoryId) => categoryId !== null
  );

  if (!categoriesExist) {
    const errorMessage = `One or more categories do not exist: ${invalidCategories.join(
      ", "
    )}.`;
    return res.status(400).send(errorMessage);
  }

  newSentence.categories = categoryIds;

  await db.collection("sentences").add(newSentence);

  return res.status(201).send(newSentence);
}
async function renderUpdatePage(req, res) {
  const sentenceId = req.params.id;
  const [sentencesSnapshot, categoriesSnapshot] = await Promise.all([
    db.collection("sentences").doc(sentenceId).get(),
    db.collection("categories").get(),
  ]);

  const sentenceData = sentencesSnapshot.data();
  const sentence = { id: sentencesSnapshot.id, ...sentenceData }; // Include the ID field in the sentence object
  const categories = categoriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
  res.render("pages/patch", { sentence, categories });
}

async function renderCreatePage(req, res) {
  getCategories()
    .then((categories) => {
      res.render("pages/post", { categories });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error fetching categories");
    });
}

async function renderListPage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortOrder = req.query.sort === "ASC" ? 1 : -1; // default is descending order

    return res.render("pages/index", {
      sentences: await getsentences(page, limit, sortOrder),
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to render the page" });
  }
}

async function getJson(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortOrder = req.query.sort === "ASC" ? 1 : -1;
    res.send(await getsentences(page, limit, sortOrder));
  } catch (error) {
    res.status(500).json({ error: "Unable to get the json" });
  }
}

async function getsentences(page, limit, sortOrder) {
  try {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const [sentencesSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection("sentences").get(),
      db.collection("categories").get(),
    ]);

    const sentences = [];
    const categoryMap = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    sentencesSnapshot.forEach((sentenceDoc) => {
      const sentenceData = sentenceDoc.data();
      const sentenceCategories = [];
      const sentence = { id: sentenceDoc.id, ...sentenceData }; // Include the ID field in the sentence data

      sentenceData.categories.forEach((categoryId) => {
        sentenceCategories.push(
          categoryMap.find((a) => {
            return categoryId === a.id;
          }).name
        );
      });

      sentences.push({ ...sentence, categories: sentenceCategories });
    });

    sentences.sort((a, b) => {
      const numCategoriesA = a.categories.length;
      const numCategoriesB = b.categories.length;
      if (numCategoriesA < numCategoriesB) return -1 * sortOrder;
      if (numCategoriesA > numCategoriesB) return 1 * sortOrder;
      return 0;
    });

    const results = sentences.slice(startIndex, endIndex);
    return results;
  } catch (error) {
    console.error(error);
    throw new Error("Error while fetching sentences");
  }
}

async function deleteSentence(req, res) {
  try {
    const sentenceId = req.params.id;
    const sentenceRef = db.collection("sentences").doc(sentenceId);
    const sentenceDoc = await sentenceRef.get();

    if (!sentenceDoc.exists) {
      res.status(404).json({ error: "Sentence not found" });
      return;
    }

    await sentenceRef.delete();
    res.status(204).json({ message: "Sentence deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to delete sentence" });
  }
}

async function updateSentence(req, res) {
  try {
    const sentenceId = req.params.id;
    const { text, categories } = req.body;
    const sentenceRef = db.collection("sentences").doc(sentenceId);
    const sentencesnapshot = await sentenceRef.get();
    if (!sentencesnapshot.exists) {
      res.status(404).json({ error: "Sentence not found" });
      return;
    }
    if (!categories) {
      const error = new Error(
        "No categories found. Send an empty list [ ] if you don't want any categories"
      );
      error.code = 403;
      throw error;
    }

    const categoriesRef = await db.collection("categories").get();
    const categoriesMap = categoriesRef.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    const invalidCategories = categories.filter(
      (categoryName) =>
        !categoriesMap.find((category) => category.name === categoryName)
    );
    if (invalidCategories.length > 0) {
      const error = new Error(
        `Invalid categories: ${invalidCategories.join(", ")}`
      );
      error.code = 403;
      throw error;
    }
    const categoryIdList = categories
      .map((categoryName) => {
        const category = categoriesMap.find(
          (category) => category.name === categoryName
        );
        return category ? category.id : null;
      })
      .filter((categoryId) => categoryId !== null);
    await sentenceRef.update({ text, categories: categoryIdList });

    const updatedsentencesnapshot = await sentenceRef.get();
    const updatedSentenceData = {
      id: updatedsentencesnapshot.id,
      text: updatedsentencesnapshot.data().text,
      categories: updatedsentencesnapshot.data().categories,
    };
    return res.status(204).send(updatedSentenceData);
  } catch (error) {
    if (error.code === 403) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unable to update sentence" });
    }
  }
}

module.exports = {
  updateSentence,
  deleteSentence,
  renderListPage,
  renderCreatePage,
  renderUpdatePage,
  getJson,
  createSentence,
};
