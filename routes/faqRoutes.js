const express = require("express")

const router = express.Router();
const FAQController = require("../controllers/faqController")

router.post("/createFaqs", FAQController.createFAQs);
router.get("/", FAQController.GetFAQs);

module.exports = router;