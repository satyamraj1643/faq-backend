require('dotenv').config();
const FAQ = require("../models/faq.js");
const tr = require("googletrans").default;
const DetectLanguage = require('detectlanguage');
const detectLanguageAPIKey = process.env.DETECT_LANGUAGE_API_KEY;
const detectlanguage = new DetectLanguage(detectLanguageAPIKey);
const Sequelize = require("sequelize");
const redisClient = require("../config/redis.js");

const PRE_TRANSLATED_LANGUAGES = ['en', 'hi', 'bn'];

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
                    console.error(`translation error for ${sourceCode} to ${targetCode}:`, error);
                    return `[translation error] ${text}`;
                }
            })
        );

    } catch (error) {
        
        throw new Error(`batch translation failed: ${error.message}`);
    }
}

const createFAQs = async (req, res) => {
    try {
        let { question, answer } = req.body;

        //validation for necessary data.
        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Both question and answer must be provided."
            });
        }
        // a helper function to detect if the question sent from client has
        // same language fro bit question and answer, for ensuring consistency and integrity

        const [questionLang, answerLang] = await Promise.all([
            detectLanguage(question),  //detectLanguage helper function defined above
            detectLanguage(answer)
        ]);


        // if language mismatch kindly alert the user.
        if (questionLang !== answerLang) {
            return res.status(400).json({
                success: false,
                message: "Question and answer must be in the same language.",
                details: { questionLanguage: questionLang, answerLanguage: answerLang }
            });
        }

        const originalLang = questionLang;

        //preparing data for storage in  which we already have and do not need to translate
        let faqData = {
            question_original: question,
            answer_original: answer,
            original_language: originalLang
        };

        //if these language is being sent , then no need to translate the one that is being sent
        // store it in question_original and answer_original as well as their respective field
        // eg. if question and answer are in english, then question_original and question_en will hold same content
        // and so will be the case for answer, (a slight latency optimization)


        if (['en', 'bn', 'hi'].includes(originalLang)) {
            faqData[`question_${originalLang}`] = question;
            faqData[`answer_${originalLang}`] = answer;
        }


        // doing the translation.
        const translations = await Promise.all(
            PRE_TRANSLATED_LANGUAGES.filter(lang => lang !== originalLang).map(async (lang) => {
                const [translatedQuestion, translatedAnswer] = await batchTranslate([question, answer], lang, originalLang);
                return {
                    [`question_${lang}`]: translatedQuestion,
                    [`answer_${lang}`]: translatedAnswer
                };
            })
        );

        //modifying the faqdata accordingly
    
        faqData = { ...faqData, ...translations.reduce((acc, curr) => ({ ...acc, ...curr }), {}) };
        const faq = await FAQ.create(faqData);

        // now is the good time to romve our cache as maybe faqs for that specific key got changed? who knows?
        const keys = await redisClient.keys("faqs:*")// wildcard to delete all things faqs.

        if(keys?.length > 0){
            //deleting all cache entires starting from faqs
           await Promise.all(keys.map(key => redisClient.del(key)));
        }
       
        
        return res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            data: faq,
            meta: { originalLanguage: originalLang, translatedLanguages: PRE_TRANSLATED_LANGUAGES.filter(lang => lang !== originalLang) }
        });


    } catch (error) {
        console.error("Error creating FAQ:", error);

        const message = error.message.includes('Language detection failed') ?
            "Issue with language, please use clearer text" :
            "Internal server error, please try again later.";
        //send a 422 if language as for unprocessable text
        return res.status(error.message.includes('Language detection failed') ? 422 : 500).json({
            success: false,
            message
        });
    }
};

const GetFAQs = async (req, res) => {
    try {

        //extract the language from the url.

        const language = req.query.lang || 'en';

        //in this case language will be enough to uniquely identify a cache key, as it
        // identifies the faqs to be fetched in bulk

        const cacheKey = `faqs:${language}`

        // let us check if our cache memory has any faq that were last fetched.

        const cachedFaqs = await redisClient.get(cacheKey);

        if (cachedFaqs) {
            console.log("[+] serving cache from the faqs");
            return res.status(200).json({
                success: true,
                message: `FAQs fetched in ${language}`,
                data: JSON.parse(cachedFaqs)
            })
        }

        let questionColumn = 'question_en';
        let answerColumn = 'answer_en';

        //check if the requested language has a table in the databse, if yes then 
        // serve the request from there only.

        if (PRE_TRANSLATED_LANGUAGES.includes(language)) {
            // this will append column specific language codes after question_{} and
            // answer_{} for querying those columns only  eg. question_en , or answer_hi  fo

            questionColumn = `question_${language}`;
            answerColumn = `answer_${language}`;

        }

        const faqs = await FAQ.findAll({
            //looking up those specific columns only
            attributes: [
                [Sequelize.col(questionColumn), 'question'],
                [Sequelize.col(answerColumn), 'answer']
            ]
        });

        //if the language is not in pre transalated set then the query params will be 
        // question_en and answer_en and we will send that to our translate api to translate
        // it in desired language.

        let finalFaqs;

        if (!PRE_TRANSLATED_LANGUAGES.includes(language)) {

            const textsToTranslate = faqs.flatMap(faq => [faq.dataValues.question, faq.dataValues.answer]);

            const translatedTexts = await batchTranslate(textsToTranslate, language, 'en');

            finalFaqs = faqs.map((faq, index) => ({
                question: translatedTexts[index * 2],
                answer: translatedTexts[index * 2 + 1],
            }));
        }
        else {
            finalFaqs = faqs;
        }

        //store the desired faqs, be it feteched from rds or our transaltion library.
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(finalFaqs));

        //send the desired faqs to our client.

        return res.status(200).json({
            success: true,
            message: `FAQ translated and fetched successfully in ${language}`,
            data: finalFaqs,
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
