const FAQ = require("../models/faq.js");
const tr = require("googletrans").default;
const DetectLanguage = require('detectlanguage');
const detectlanguage = new DetectLanguage('0b26a8de09f9c188c32099342ed05ff2');
const PRE_TRANSLATED_LANGUAGES = ['en', 'hi', 'bn'];
const Sequelize = require("sequelize");

async function detectLanguage(text) {
    try {
        const result = await detectlanguage.detect(text);
        if (!result || !result.length || !result[0].language) {
            throw new Error('Language detection failed');
        }
        return result[0].language;
    } catch (error) {
        console.error('Language detection error:', error);
        throw error;
    }
}

async function batchTranslate(texts, targetCode, sourceCode) {
    try {
        return Promise.all(
            texts.map(async (text) => {
                try {
                    const translation = await tr(text, {
                        from: sourceCode,
                        to: targetCode
                    });
                    return translation.text.trim();
                } catch (error) {
                    console.error(`Translation error for ${sourceCode} to ${targetCode}:`, error);
                    return `[Translation Error] ${text}`;
                }
            })
        );
    } catch (error) {
        throw new Error(`Batch translation failed: ${error.message}`);
    }
}

const createFAQs = async (req, res) => {
    try {
        let { question, answer } = req.body;
        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Both question and answer must be provided."
            });
        }
        const [questionLang, answerLang] = await Promise.all([
            detectLanguage(question),
            detectLanguage(answer)
        ]);
        if (questionLang !== answerLang) {
            return res.status(400).json({
                success: false,
                message: "Question and answer must be in the same language.",
                details: { questionLanguage: questionLang, answerLanguage: answerLang }
            });
        }
        const originalLang = questionLang;
        let faqData = {
            question_original: question,
            answer_original: answer,
            original_language: originalLang
        };
        if (['en', 'bn', 'hi'].includes(originalLang)) {
            faqData[`question_${originalLang}`] = question;
            faqData[`answer_${originalLang}`] = answer;
        }
        const translations = await Promise.all(
            PRE_TRANSLATED_LANGUAGES.filter(lang => lang !== originalLang).map(async (lang) => {
                const [translatedQuestion, translatedAnswer] = await batchTranslate([question, answer], lang, originalLang);
                return {
                    [`question_${lang}`]: translatedQuestion,
                    [`answer_${lang}`]: translatedAnswer
                };
            })
        );
        faqData = { ...faqData, ...translations.reduce((acc, curr) => ({ ...acc, ...curr }), {}) };
        const faq = await FAQ.create(faqData);
        return res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            data: faq,
            meta: { originalLanguage: originalLang, translatedLanguages: PRE_TRANSLATED_LANGUAGES.filter(lang => lang !== originalLang) }
        });
    } catch (error) {
        console.error("Error creating FAQ:", error);
        const message = error.message.includes('Language detection failed') ?
            "Unable to detect language. Please try again with clearer text." :
            "Internal server error. Please try again later.";
        return res.status(error.message.includes('Language detection failed') ? 422 : 500).json({
            success: false,
            message
        });
    }
};

const GetFAQs = async (req, res) => {
    try {
        const language = req.query.lang || 'en';
        let questionColumn = 'question_en';
        let answerColumn = 'answer_en';
        if (PRE_TRANSLATED_LANGUAGES.includes(language)) {
            questionColumn = `question_${language}`;
            answerColumn = `answer_${language}`;
        }
        const faqs = await FAQ.findAll({
            attributes: [
                [Sequelize.col(questionColumn), 'question'],
                [Sequelize.col(answerColumn), 'answer']
            ]
        });
        if (!PRE_TRANSLATED_LANGUAGES.includes(language)) {
            const textsToTranslate = faqs.flatMap(faq => [faq.dataValues.question, faq.dataValues.answer]);
            const translatedTexts = await batchTranslate(textsToTranslate, language, 'en');
            const translatedFaqs = faqs.map((faq, index) => ({
                question: translatedTexts[index * 2],
                answer: translatedTexts[index * 2 + 1],
            }));
            return res.status(200).json({
                success: true,
                message: `FAQ translated and fetched successfully in ${language}`,
                data: translatedFaqs,
            });
        }
        return res.status(200).json({
            success: true,
            message: 'FAQ fetched successfully',
            data: faqs,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createFAQs,
    GetFAQs
};
